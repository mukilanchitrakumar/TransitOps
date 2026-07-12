import { Request, Response } from 'express';
import prisma from '../config/db';
import { DriverCreateSchema, DriverUpdateSchema } from 'shared';
import { logActivity } from '../utils/audit';

export async function getDrivers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, drivers] = await Promise.all([
      prisma.driver.count({ where }),
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: drivers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getDriverById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findFirst({
      where: { id, deletedAt: null },
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    return res.json({ success: true, data: driver });
  } catch (error) {
    console.error('Error fetching driver detail:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createDriver(req: Request, res: Response) {
  try {
    const parseResult = DriverCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = parseResult.data;

    const existingLicense = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      return res.status(400).json({
        success: false,
        error: 'A driver with this license number already exists',
      });
    }

    if (data.userId) {
      const existingUser = await prisma.driver.findUnique({
        where: { userId: data.userId },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'A driver profile is already associated with this user ID',
        });
      }
    }

    const driver = await prisma.driver.create({
      data: {
        fullName: data.fullName,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        phone: data.phone,
        status: data.status,
        safetyScore: data.safetyScore,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        address: data.address,
        userId: data.userId || null,
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'DRIVER_CREATE',
      module: 'DRIVERS',
      entityId: driver.id,
      entityType: 'Driver',
      details: { fullName: driver.fullName, licenseNumber: driver.licenseNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: driver });
  } catch (error) {
    console.error('Error creating driver:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateDriver(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.driver.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const parseResult = DriverUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = parseResult.data;

    if (data.licenseNumber && data.licenseNumber !== existing.licenseNumber) {
      const licenseCheck = await prisma.driver.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });
      if (licenseCheck) {
        return res.status(400).json({
          success: false,
          error: 'A driver with this license number already exists',
        });
      }
    }

    if (data.userId && data.userId !== existing.userId) {
      const userCheck = await prisma.driver.findUnique({
        where: { userId: data.userId },
      });
      if (userCheck) {
        return res.status(400).json({
          success: false,
          error: 'A driver profile is already associated with this user ID',
        });
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        fullName: data.fullName,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
        phone: data.phone,
        status: data.status,
        safetyScore: data.safetyScore,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        address: data.address,
        userId: data.userId !== undefined ? data.userId : undefined,
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'DRIVER_UPDATE',
      module: 'DRIVERS',
      entityId: driver.id,
      entityType: 'Driver',
      details: { fullName: driver.fullName, status: driver.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: driver });
  } catch (error) {
    console.error('Error updating driver:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function deleteDriver(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.driver.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const activeTripsCount = await prisma.trip.count({
      where: {
        driverId: id,
        status: { in: ['DISPATCHED', 'DRAFT'] },
      },
    });

    if (activeTripsCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete driver. They have active/dispatched trips linked to them.',
      });
    }

    await prisma.driver.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'DRIVER_SOFT_DELETE',
      module: 'DRIVERS',
      entityId: id,
      entityType: 'Driver',
      details: { fullName: existing.fullName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Driver deleted successfully (soft-delete)' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
