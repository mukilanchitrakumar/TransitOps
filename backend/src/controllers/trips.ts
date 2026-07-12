import { Request, Response } from 'express';
import prisma from '../config/db';
import { TripCreateSchema, TripUpdateSchema } from 'shared';
import { logActivity } from '../utils/audit';

export async function getTrips(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { tripNumber: { contains: search, mode: 'insensitive' } },
        { startLocation: { contains: search, mode: 'insensitive' } },
        { endLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Support pagination & avoid N+1 queries by pre-fetching relationships via Prisma include
    const [total, trips] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        include: {
          vehicle: {
            select: { id: true, plateNumber: true, make: true, model: true, currentOdometer: true },
          },
          driver: {
            select: { id: true, fullName: true, licenseNumber: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getTripById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        creator: { select: { id: true, email: true, fullName: true } },
        completer: { select: { id: true, email: true, fullName: true } },
        expenses: true,
      },
    });

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    return res.json({ success: true, data: trip });
  } catch (error) {
    console.error('Error fetching trip detail:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createTrip(req: Request, res: Response) {
  try {
    const parseResult = TripCreateSchema.safeParse(req.body);
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

    if (vehicle.status === 'RETIRED') {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.plateNumber} cannot be booked because it is retired.`,
      });
    }

    if (vehicle.status === 'MAINTENANCE') {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.plateNumber} cannot be booked because it is currently under maintenance in shop.`,
      });
    }

    if (vehicle.status === 'OUT_OF_SERVICE') {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.plateNumber} cannot be booked because it is out of service.`,
      });
    }

    const driver = await prisma.driver.findFirst({
      where: { id: data.driverId, deletedAt: null },
    });
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    if (driver.status === 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        error: `Driver ${driver.fullName} cannot be assigned because they are currently suspended.`,
      });
    }

    if (driver.status === 'INACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Driver ${driver.fullName} cannot be assigned because they are currently inactive.`,
      });
    }

    const expiryDate = new Date(driver.licenseExpiry);
    if (expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        error: `Driver ${driver.fullName} cannot be assigned because the driving license expired on ${expiryDate.toLocaleDateString()}.`,
      });
    }

    if (data.cargoWeight && data.cargoWeight > vehicle.capacity) {
      return res.status(400).json({
        success: false,
        error: `Cargo Weight (${data.cargoWeight} kg) exceeds Maximum Load Capacity (${vehicle.capacity} kg) of vehicle ${vehicle.plateNumber}. Booking blocked.`,
      });
    }

    const driverConflict = await prisma.trip.findFirst({
      where: {
        driverId: data.driverId,
        status: 'DISPATCHED',
      },
    });
    if (driverConflict) {
      return res.status(400).json({
        success: false,
        error: `Driver ${driver.fullName} cannot be assigned because they are currently assigned to active trip ${driverConflict.tripNumber}.`,
      });
    }

    const vehicleConflict = await prisma.trip.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: 'DISPATCHED',
      },
    });
    if (vehicleConflict) {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.plateNumber} cannot be booked because it is currently assigned to active trip ${vehicleConflict.tripNumber}.`,
      });
    }

    // Generate unique trip reference number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.trip.count({
      where: {
        tripNumber: { startsWith: `TRP-${todayStr}` },
      },
    });
    const tripNumber = `TRP-${todayStr}-${(count + 1).toString().padStart(4, '0')}`;

    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        plannedStart: new Date(data.plannedStart),
        plannedEnd: new Date(data.plannedEnd),
        purpose: data.purpose,
        cargoWeight: data.cargoWeight,
        plannedDistance: data.plannedDistance,
        estimatedCost: data.estimatedCost,
        notes: data.notes,
        status: 'DRAFT',
        createdBy: req.user?.userId || null,
      },
    });

    logActivity({
      userId: req.user?.userId,
      action: 'TRIP_CREATE_DRAFT',
      module: 'TRIPS',
      entityId: trip.id,
      entityType: 'Trip',
      details: { tripNumber: trip.tripNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error('Error creating trip:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function dispatchTrip(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: `Cannot dispatch trip. Status must be DRAFT, current status is ${trip.status}`,
      });
    }

    // Verify driver is active before dispatch
    if (trip.driver.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Cannot dispatch. Driver is not ACTIVE (current status: ${trip.driver.status})`,
      });
    }

    // Verify driver license expiry
    if (new Date(trip.driver.licenseExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        error: `Cannot dispatch. Driver license is expired.`,
      });
    }

    // Verify vehicle is active before dispatch
    if (trip.vehicle.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Cannot dispatch. Vehicle is not ACTIVE (current status: ${trip.vehicle.status})`,
      });
    }

    // Check concurrency once more
    const activeDriverTrip = await prisma.trip.findFirst({
      where: { driverId: trip.driverId, status: 'DISPATCHED' },
    });
    if (activeDriverTrip) {
      return res.status(400).json({ success: false, error: 'Driver is already on an active trip.' });
    }

    const activeVehicleTrip = await prisma.trip.findFirst({
      where: { vehicleId: trip.vehicleId, status: 'DISPATCHED' },
    });
    if (activeVehicleTrip) {
      return res.status(400).json({ success: false, error: 'Vehicle is already on an active trip.' });
    }

    // Perform database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update trip status
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          actualStart: new Date(),
          startOdometer: trip.vehicle.currentOdometer,
        },
      });

      // 2. Set driver status -> ON_TRIP
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: 'ON_TRIP' },
      });

      // 3. Set vehicle status -> ON_TRIP
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'ON_TRIP' },
      });

      return updatedTrip;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'TRIP_DISPATCH',
      module: 'TRIPS',
      entityId: id,
      entityType: 'Trip',
      details: { tripNumber: trip.tripNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error dispatching trip:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function completeTrip(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { endOdometer, actualCost, notes } = req.body;

    if (endOdometer === undefined || endOdometer === null) {
      return res.status(400).json({ success: false, error: 'End odometer reading is required' });
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.status !== 'DISPATCHED') {
      return res.status(400).json({
        success: false,
        error: `Cannot complete trip. Status must be DISPATCHED, current status is ${trip.status}`,
      });
    }

    const startOdo = trip.startOdometer || trip.vehicle.currentOdometer;
    if (parseInt(endOdometer) < startOdo) {
      return res.status(400).json({
        success: false,
        error: `Invalid Odometer: End odometer (${endOdometer}) cannot be less than start odometer (${startOdo})`,
      });
    }

    const distance = parseInt(endOdometer) - startOdo;

    // Database transaction to complete trip and restore vehicle/driver availability
    const result = await prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date(),
          endOdometer: parseInt(endOdometer),
          distanceKm: distance,
          actualCost: actualCost ? parseFloat(actualCost) : undefined,
          notes: notes || undefined,
          completedBy: req.user?.userId || null,
        },
      });

      // Update vehicle odometer and return to ACTIVE
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: 'ACTIVE',
          currentOdometer: parseInt(endOdometer),
        },
      });

      // Update driver back to ACTIVE
      await tx.driver.update({
        where: { id: trip.driverId },
        data: {
          status: 'ACTIVE',
        },
      });

      return updatedTrip;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'TRIP_COMPLETE',
      module: 'TRIPS',
      entityId: id,
      entityType: 'Trip',
      details: { tripNumber: trip.tripNumber, distanceKm: distance, finalOdometer: endOdometer },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error completing trip:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function cancelTrip(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel trip. Trip is already in ${trip.status} state`,
      });
    }

    // Execute transaction to revert driver and vehicle status if already DISPATCHED
    const result = await prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      if (trip.status === 'DISPATCHED') {
        // Return driver to ACTIVE
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: 'ACTIVE' },
        });

        // Return vehicle to ACTIVE
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: 'ACTIVE' },
        });
      }

      return updatedTrip;
    });

    logActivity({
      userId: req.user?.userId,
      action: 'TRIP_CANCEL',
      module: 'TRIPS',
      entityId: id,
      entityType: 'Trip',
      details: { tripNumber: trip.tripNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error cancelling trip:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
