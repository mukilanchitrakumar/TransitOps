import { Request, Response } from 'express';
import prisma from '../config/db';
import { MaintenanceCreateSchema, MaintenanceUpdateSchema } from 'shared';
import { logActivity } from '../utils/audit';

export async function getMaintenances(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || '';
    const vehicleId = (req.query.vehicleId as string) || '';

    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;

    const [total, maintenances] = await Promise.all([
      prisma.maintenance.count({ where }),
      prisma.maintenance.findMany({
        where,
        skip,
        take: limit,
        include: {
          vehicle: { select: { id: true, plateNumber: true, make: true, model: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: maintenances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching maintenances:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createMaintenance(req: Request, res: Response) {
  try {
    const parseResult = MaintenanceCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = parseResult.data;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, deletedAt: null },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        vehicleId: data.vehicleId,
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        maintenanceType: data.maintenanceType,
        cost: data.cost,
        performedBy: data.performedBy,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        status: 'SCHEDULED',
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      entityId: maintenance.id,
      entityType: 'Maintenance',
      details: { vehiclePlate: vehicle.plateNumber, scheduledDate: maintenance.scheduledDate },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function startMaintenance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!maintenance) {
      return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    }

    if (maintenance.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        error: `Cannot start maintenance. Current status is ${maintenance.status}`,
      });
    }

    if (maintenance.vehicle.status === 'ON_TRIP') {
      return res.status(400).json({
        success: false,
        error: 'Cannot start maintenance. Vehicle is currently on trip.',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedMaintenance = await tx.maintenance.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });

      await tx.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: 'MAINTENANCE' },
      });

      return updatedMaintenance;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'MAINTENANCE_START',
      module: 'MAINTENANCE',
      entityId: id,
      entityType: 'Maintenance',
      details: { vehiclePlate: maintenance.vehicle.plateNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error starting maintenance:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function completeMaintenance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { cost, performedBy, invoiceNumber, notes } = req.body;

    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!maintenance) {
      return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    }

    if (maintenance.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: `Cannot complete maintenance. Current status is ${maintenance.status}`,
      });
    }

    const finalCost = cost !== undefined ? parseFloat(cost) : 0;
    if (finalCost < 0) {
      return res.status(400).json({ success: false, error: 'Cost cannot be negative' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedMaintenance = await tx.maintenance.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
          cost: finalCost,
          performedBy: performedBy || maintenance.performedBy,
          invoiceNumber: invoiceNumber || maintenance.invoiceNumber,
          notes: notes || maintenance.notes,
        },
      });

      await tx.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: 'ACTIVE' },
      });

      return updatedMaintenance;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'MAINTENANCE_COMPLETE',
      module: 'MAINTENANCE',
      entityId: id,
      entityType: 'Maintenance',
      details: { vehiclePlate: maintenance.vehicle.plateNumber, cost: finalCost },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function cancelMaintenance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
    });

    if (!maintenance) {
      return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    }

    if (maintenance.status === 'COMPLETED' || maintenance.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel maintenance. Current status is ${maintenance.status}`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedMaintenance = await tx.maintenance.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      if (maintenance.status === 'IN_PROGRESS') {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: 'ACTIVE' },
        });
      }

      return updatedMaintenance;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'MAINTENANCE_CANCEL',
      module: 'MAINTENANCE',
      entityId: id,
      entityType: 'Maintenance',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error cancelling maintenance:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
