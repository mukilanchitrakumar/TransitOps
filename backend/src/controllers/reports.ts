import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getDashboardMetrics(req: Request, res: Response) {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalVehicles,
      activeVehicles,
      onTripVehicles,
      maintenanceVehicles,
      activeDrivers,
      activeTrips,
      pendingExpenses,
      monthlyFuelSum,
      recentActivity,
      expiredLicensesCount,
      upcomingServicesCount,
      recentMaintenance,
      drivers,
      activeTripsList,
      expiringLicenses7Days,
      maintenanceDueSoon
    ] = await Promise.all([
      prisma.vehicle.count({ where: { deletedAt: null } }),
      prisma.vehicle.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP', deletedAt: null } }),
      prisma.vehicle.count({ where: { status: 'MAINTENANCE', deletedAt: null } }),
      prisma.driver.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.expense.count({ where: { status: 'PENDING' } }),
      prisma.fuelLog.aggregate({
        _sum: { cost: true },
        where: { logDate: { gte: startOfMonth } },
      }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.driver.count({
        where: {
          deletedAt: null,
          licenseExpiry: { lte: new Date() },
        },
      }),
      prisma.vehicle.count({
        where: {
          deletedAt: null,
          nextServiceDate: { lte: new Date() },
        }
      }),
      prisma.maintenance.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { plateNumber: true } } }
      }),
      prisma.driver.findMany({ where: { deletedAt: null } }),
      prisma.trip.findMany({
        where: { status: 'DISPATCHED' },
        include: { vehicle: true, driver: true }
      }),
      prisma.driver.count({
        where: {
          deletedAt: null,
          licenseExpiry: {
            gt: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.vehicle.count({
        where: {
          deletedAt: null,
          OR: [
            { nextServiceDate: { gt: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
          ]
        }
      })
    ]);

    // Check operational business rule violations
    let overloadedCount = 0;
    let expiredAssignedCount = 0;
    let maintenanceAssignedCount = 0;
    let doubleBookedCount = 0;

    const seenDrivers = new Set<string>();
    const seenVehicles = new Set<string>();

    for (const trip of activeTripsList) {
      if (trip.cargoWeight && trip.cargoWeight > trip.vehicle.capacity) {
        overloadedCount++;
      }
      if (new Date(trip.driver.licenseExpiry) < new Date()) {
        expiredAssignedCount++;
      }
      if (trip.vehicle.status === 'MAINTENANCE') {
        maintenanceAssignedCount++;
      }
      if (seenDrivers.has(trip.driverId)) {
        doubleBookedCount++;
      }
      seenDrivers.add(trip.driverId);
      if (seenVehicles.has(trip.vehicleId)) {
        doubleBookedCount++;
      }
      seenVehicles.add(trip.vehicleId);
    }

    const utilization = totalVehicles > 0 ? (onTripVehicles / totalVehicles) * 100 : 0;

    let vehicleAvailability = totalVehicles > 0 ? (activeVehicles / totalVehicles) : 1;
    
    const [completedMaint, totalMaint] = await Promise.all([
      prisma.maintenance.count({ where: { status: 'COMPLETED' } }),
      prisma.maintenance.count(),
    ]);
    const maintCompletionRate = totalMaint > 0 ? (completedMaint / totalMaint) : 1;

    const safetyScores = drivers.filter(d => d.safetyScore !== null).map(d => d.safetyScore as number);
    const avgSafetyScore = safetyScores.length > 0 ? (safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length) / 100 : 0.95;

    const [completedTrips, totalTripsCount] = await Promise.all([
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({ where: { status: { in: ['COMPLETED', 'CANCELLED'] } } }),
    ]);
    const tripCompletionRate = totalTripsCount > 0 ? (completedTrips / totalTripsCount) : 1;

    const healthScoreVal = Math.round(
      (vehicleAvailability * 20 +
       maintCompletionRate * 20 +
       avgSafetyScore * 40 +
       tripCompletionRate * 20) * 100
    );

    const statusPie = [
      { name: 'Active', value: activeVehicles },
      { name: 'On Trip', value: onTripVehicles },
      { name: 'Maintenance', value: maintenanceVehicles },
      { name: 'Out Of Service', value: await prisma.vehicle.count({ where: { status: 'OUT_OF_SERVICE', deletedAt: null } }) },
      { name: 'Retired', value: await prisma.vehicle.count({ where: { status: 'RETIRED', deletedAt: null } }) },
    ].filter(i => i.value > 0);

    const expenseSums = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { status: 'APPROVED' },
    });
    const expenseBreakdown = expenseSums.map(item => ({
      category: item.category,
      amount: parseFloat(item._sum.amount?.toString() || '0'),
    }));

    return res.json({
      success: true,
      metrics: {
        totalVehicles,
        activeVehicles,
        onTripVehicles,
        maintenanceVehicles,
        activeDrivers,
        activeTrips,
        pendingExpenses,
        utilization: Math.round(utilization),
        monthlyFuelCost: parseFloat(monthlyFuelSum._sum.cost?.toString() || '0'),
        fleetHealthScore: Math.min(100, Math.max(10, healthScoreVal)),
        expiredLicenses: expiredLicensesCount,
        upcomingServices: upcomingServicesCount,
        factors: {
          vehicleAvailability: Math.round(vehicleAvailability * 100),
          maintenanceCompletion: Math.round(maintCompletionRate * 100),
          driverSafety: Math.round(avgSafetyScore * 100),
          tripCompletion: Math.round(tripCompletionRate * 100)
        }
      },
      businessRules: {
        overloadedTrips: overloadedCount,
        doubleBookings: doubleBookedCount,
        expiredDriversAssigned: expiredAssignedCount,
        vehiclesAssignedInMaintenance: maintenanceAssignedCount,
        expiringLicenses7Days,
        maintenanceDueSoon
      },
      recentActivity,
      recentMaintenance,
      charts: {
        statusPie,
        expenseBreakdown,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard aggregations:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
