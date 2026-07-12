import { Request, Response } from 'express';
import prisma from '../config/db';
import { ExpenseCreateSchema } from 'shared';
import { logActivity } from '../utils/audit';

export async function getExpenses(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || '';
    const category = (req.query.category as string) || '';

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    if (userRole === 'DRIVER') {
      where.createdBy = userId;
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: {
          trip: { select: { id: true, tripNumber: true } },
          vehicle: { select: { id: true, plateNumber: true } },
          creator: { select: { id: true, fullName: true, email: true } },
          approver: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createExpense(req: Request, res: Response) {
  try {
    const parseResult = ExpenseCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = parseResult.data;

    if (data.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
      if (!trip) {
        return res.status(404).json({ success: false, error: 'Linked trip not found' });
      }
    }

    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, deletedAt: null },
      });
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Linked vehicle not found' });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        tripId: data.tripId || null,
        vehicleId: data.vehicleId || null,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        attachmentUrl: data.attachmentUrl || null,
        notes: data.notes,
        status: 'PENDING',
        createdBy: req.user?.userId || '',
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'EXPENSE_LOG',
      module: 'EXPENSES',
      entityId: expense.id,
      entityType: 'Expense',
      details: { amount: data.amount, category: data.category },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function approveExpense(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Expense has already been resolved with status: ${expense.status}`,
      });
    }

    const result = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user?.userId || null,
        approvalDate: new Date(),
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'EXPENSE_APPROVE',
      module: 'EXPENSES',
      entityId: id,
      entityType: 'Expense',
      details: { amount: expense.amount, category: expense.category },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error approving expense:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function rejectExpense(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Expense has already been resolved with status: ${expense.status}`,
      });
    }

    const result = await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: req.user?.userId || null,
        approvalDate: new Date(),
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'EXPENSE_REJECT',
      module: 'EXPENSES',
      entityId: id,
      entityType: 'Expense',
      details: { amount: expense.amount, category: expense.category },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error rejecting expense:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
