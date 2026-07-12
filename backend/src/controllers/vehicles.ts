import { Request, Response } from 'express';
import prisma from '../config/db';
import { VehicleCreateSchema, VehicleUpdateSchema } from 'shared';
import { logActivity } from '../utils/audit';

export async function getVehicles(req: Request, res: Response) {
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
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: vehicles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getVehicleById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    return res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching vehicle detail:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createVehicle(req: Request, res: Response) {
  try {
    const parseResult = VehicleCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = parseResult.data;

    const existing = await prisma.vehicle.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A vehicle with this plate number already exists',
      });
    }

    if (data.vinNumber) {
      const existingVin = await prisma.vehicle.findUnique({
        where: { vinNumber: data.vinNumber },
      });
      if (existingVin) {
        return res.status(400).json({
          success: false,
          error: 'A vehicle with this VIN number already exists',
        });
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        category: data.category,
        capacity: data.capacity,
        fuelType: data.fuelType,
        imageUrl: data.imageUrl || null,
        vinNumber: data.vinNumber || null,
        currentOdometer: data.currentOdometer,
        status: 'ACTIVE',
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'VEHICLE_CREATE',
      module: 'VEHICLES',
      entityId: vehicle.id,
      entityType: 'Vehicle',
      details: { plateNumber: vehicle.plateNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    const parseResult = VehicleUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = parseResult.data;

    if (data.plateNumber && data.plateNumber !== existing.plateNumber) {
      const plateCheck = await prisma.vehicle.findUnique({
        where: { plateNumber: data.plateNumber },
      });
      if (plateCheck) {
        return res.status(400).json({
          success: false,
          error: 'A vehicle with this plate number already exists',
        });
      }
    }

    if (data.vinNumber && data.vinNumber !== existing.vinNumber) {
      const vinCheck = await prisma.vehicle.findUnique({
        where: { vinNumber: data.vinNumber },
      });
      if (vinCheck) {
        return res.status(400).json({
          success: false,
          error: 'A vehicle with this VIN number already exists',
        });
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber: data.plateNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        category: data.category,
        capacity: data.capacity,
        fuelType: data.fuelType,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        vinNumber: data.vinNumber !== undefined ? data.vinNumber : undefined,
        status: data.status,
        currentOdometer: data.currentOdometer,
        nextServiceOdometer: data.nextServiceOdometer,
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : undefined,
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'VEHICLE_UPDATE',
      module: 'VEHICLES',
      entityId: vehicle.id,
      entityType: 'Vehicle',
      details: { plateNumber: vehicle.plateNumber, status: vehicle.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    const activeTripsCount = await prisma.trip.count({
      where: {
        vehicleId: id,
        status: { in: ['DISPATCHED', 'DRAFT'] },
      },
    });

    if (activeTripsCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete vehicle. It has active/dispatched trips linked to it.',
      });
    }

    await prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'VEHICLE_SOFT_DELETE',
      module: 'VEHICLES',
      entityId: id,
      entityType: 'Vehicle',
      details: { plateNumber: existing.plateNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Vehicle deleted successfully (soft-delete)' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
