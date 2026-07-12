import { Request, Response } from 'express';
import prisma from '../config/db';
import { FuelLogCreateSchema } from 'shared';
import { logActivity } from '../utils/audit';

export async function getFuelLogs(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const vehicleId = (req.query.vehicleId as string) || '';

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const [total, fuelLogs] = await Promise.all([
      prisma.fuelLog.count({ where }),
      prisma.fuelLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          vehicle: { select: { id: true, plateNumber: true, make: true, model: true } },
          driver: { select: { id: true, fullName: true } },
        },
        orderBy: { logDate: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: fuelLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fuel logs:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createFuelLog(req: Request, res: Response) {
  try {
    const parseResult = FuelLogCreateSchema.safeParse(req.body);
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

    const driver = await prisma.driver.findFirst({
      where: { id: data.driverId, deletedAt: null },
    });
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    if (data.odometerReading < vehicle.currentOdometer) {
      return res.status(400).json({
        success: false,
        error: `Odometer reading (${data.odometerReading}) cannot be less than the vehicle's current odometer (${vehicle.currentOdometer})`,
      });
    }

    const lastFuelLog = await prisma.fuelLog.findFirst({
      where: { vehicleId: data.vehicleId },
      orderBy: { odometerReading: 'desc' },
    });

    let previousOdometer = vehicle.currentOdometer;
    if (lastFuelLog) {
      previousOdometer = lastFuelLog.odometerReading;
    }

    const odometerDiff = data.odometerReading - previousOdometer;
    let efficiency = null;

    if (odometerDiff > 0 && data.fuelQuantity > 0) {
      efficiency = odometerDiff / data.fuelQuantity;
    }

    const result = await prisma.$transaction(async (tx) => {
      const fuelLog = await tx.fuelLog.create({
        data: {
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          logDate: data.logDate ? new Date(data.logDate) : new Date(),
          odometerReading: data.odometerReading,
          fuelQuantity: data.fuelQuantity,
          cost: data.cost,
          efficiency,
          fuelStation: data.fuelStation,
          pricePerUnit: data.pricePerUnit,
          receiptNumber: data.receiptNumber,
          notes: data.notes,
        },
      });

      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentOdometer: data.odometerReading },
      });

      return fuelLog;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'FUEL_LOG_CREATE',
      module: 'FUEL',
      entityId: result.id,
      entityType: 'FuelLog',
      details: { vehiclePlate: vehicle.plateNumber, efficiency, cost: data.cost },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating fuel log:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
