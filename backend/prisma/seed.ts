import { 
  PrismaClient, 
  UserRole, 
  VehicleCategory, 
  VehicleStatus, 
  DriverStatus, 
  TripStatus, 
  MaintenanceStatus, 
  ExpenseCategory, 
  ExpenseStatus 
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================================
// DATA POOLS FOR REALISM
// ============================================================================
const firstNames = ["Aarav", "Aditya", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Kabir", "Nitesh", "Rajesh", "Suresh", "Ramesh", "Mukesh", "Ravi", "Manoj", "Anil", "Sunil", "Prakash", "Vijay", "Sanjay", "Deepak", "Vikram", "Rahul", "Amit", "Karthik", "Ganesh", "Murali", "Surya", "Harish", "Praveen", "Vignesh", "Balaji", "Prasad", "Naveen", "Ashok", "Gopi", "Kiran", "Sathish"];
const lastNames = ["Sharma", "Verma", "Gupta", "Kumar", "Singh", "Yadav", "Patil", "Deshmukh", "Nair", "Menon", "Reddy", "Rao", "Naidu", "Pillai", "Iyer", "Joshi", "Kulkarni", "Deshpande", "Bhatt", "Das", "Mukherjee", "Banerjee", "Sengupta", "Bose", "Gowda", "Hegde", "Shetty", "Choudhary", "Mehta", "Jain"];
const cities = ["Chennai", "Coimbatore", "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Kochi", "Madurai", "Salem", "Erode", "Tiruchirappalli", "Mysuru", "Thiruvananthapuram", "Vijayawada", "Visakhapatnam", "Nagpur", "Nashik", "Ahmedabad", "Surat", "Jaipur"];
const makes = ["Tata", "Ashok Leyland", "Mahindra", "Eicher", "BharatBenz", "Volvo", "Scania"];
const models = ["Prima", "Signa", "Blazo", "Pro", "FMX", "G410", "Dost", "Bolero Pickup"];

// ============================================================================
// HELPERS
// ============================================================================
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const generatePhone = () => `+91 ${randomNumber(6000000000, 9999999999)}`;
const generateLicense = () => `TN${randomNumber(10, 99)} ${randomNumber(2000, 2024)}${randomNumber(1000000, 9999999)}`;
const generatePlate = () => `TN${randomNumber(10, 99)} ${randomElement(['A','B','C','D','E','F','G','H'])} ${randomNumber(1000, 9999)}`;
const generateVIN = () => `MA1${randomElement(['A','B','C','D','E'])}H${randomNumber(10000000000, 99999999999)}`;

async function main() {
  console.log('Clearing existing data...');
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.activityLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared. Starting seed...');

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);
  const now = new Date();

  // ============================================================================
  // 1. USERS
  // ============================================================================
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@transitops.com',
      passwordHash,
      fullName: 'Marc Anderson',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    }
  });

  const fleetManagers = [];
  for (let i = 1; i <= 3; i++) {
    fleetManagers.push(await prisma.user.create({
      data: {
        email: `manager${i}@transitops.com`,
        passwordHash: staffPasswordHash,
        fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        role: UserRole.FLEET_MANAGER,
        isActive: true,
      }
    }));
  }

  const safetyOfficers = [];
  for (let i = 1; i <= 2; i++) {
    safetyOfficers.push(await prisma.user.create({
      data: {
        email: `safety${i}@transitops.com`,
        passwordHash: staffPasswordHash,
        fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        role: UserRole.SAFETY_OFFICER,
        isActive: true,
      }
    }));
  }

  const financialAnalysts = [];
  for (let i = 1; i <= 2; i++) {
    financialAnalysts.push(await prisma.user.create({
      data: {
        email: `finance${i}@transitops.com`,
        passwordHash: staffPasswordHash,
        fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        role: UserRole.FINANCIAL_ANALYST,
        isActive: true,
      }
    }));
  }

  // ============================================================================
  // 2. DRIVERS
  // ============================================================================
  const drivers = [];
  for (let i = 1; i <= 40; i++) {
    let safetyScore = randomNumber(75, 100);
    let status = DriverStatus.ACTIVE;
    let licenseExpiry = randomDate(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90), new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1000));
    
    if (i <= 5) {
      safetyScore = randomNumber(96, 100); // Top performers
    } else if (i === 6) {
      status = DriverStatus.SUSPENDED; // 1 suspended
      safetyScore = randomNumber(50, 74);
    } else if (i <= 8) {
      licenseExpiry = randomDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10)); // 2 expiring/expired
    } else if (i <= 18) {
      safetyScore = randomNumber(75, 85); // 5 average (plus more)
    }

    const driverUser = await prisma.user.create({
      data: {
        email: `driver${i}@transitops.com`,
        passwordHash: staffPasswordHash,
        fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        role: UserRole.DRIVER,
        isActive: status !== DriverStatus.SUSPENDED,
      }
    });

    drivers.push(await prisma.driver.create({
      data: {
        userId: driverUser.id,
        fullName: driverUser.fullName,
        licenseNumber: generateLicense(),
        licenseCategory: randomElement(['HMV', 'LMV', 'TRANS']),
        licenseExpiry,
        phone: generatePhone(),
        status,
        safetyScore,
        emergencyContactName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        emergencyContactPhone: generatePhone(),
        address: `${randomNumber(1, 999)}, ${randomElement(cities)}`,
      }
    }));
  }

  // ============================================================================
  // 3. VEHICLES
  // ============================================================================
  const vehicles = [];
  const vehicleStatuses = [VehicleStatus.ACTIVE, VehicleStatus.ON_TRIP, VehicleStatus.MAINTENANCE, VehicleStatus.OUT_OF_SERVICE, VehicleStatus.RETIRED];
  
  for (let i = 1; i <= 50; i++) {
    let status = VehicleStatus.ACTIVE;
    if (i <= 18) status = VehicleStatus.ON_TRIP;
    else if (i <= 24) status = VehicleStatus.MAINTENANCE; // 6 in maintenance
    else if (i === 25) status = VehicleStatus.OUT_OF_SERVICE;
    else if (i === 26) status = VehicleStatus.RETIRED;

    const currentOdometer = randomNumber(10000, 250000);
    const category = randomElement([VehicleCategory.TRUCK, VehicleCategory.VAN, VehicleCategory.SUV, VehicleCategory.SEDAN]);
    let fuelType = randomElement(['DIESEL', 'CNG']);
    if (category === VehicleCategory.SEDAN) fuelType = 'EV';

    vehicles.push(await prisma.vehicle.create({
      data: {
        plateNumber: generatePlate(),
        make: randomElement(makes),
        model: randomElement(models),
        year: randomNumber(2018, 2024),
        category,
        status,
        acquisitionCost: randomFloat(800000, 3500000),
        currentOdometer,
        capacity: randomNumber(2, 20),
        fuelType,
        vinNumber: generateVIN(),
        nextServiceOdometer: currentOdometer + randomNumber(1000, 5000),
        nextServiceDate: randomDate(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7), new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90)),
      }
    }));
  }

  // ============================================================================
  // 4. TRIPS
  // ============================================================================
  const trips = [];
  const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.ON_TRIP);
  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.ACTIVE);
  const availableDrivers = drivers.filter(d => d.status === DriverStatus.ACTIVE);

  for (let i = 1; i <= 120; i++) {
    let tripStatus = TripStatus.COMPLETED;
    let vehicle = randomElement(vehicles);
    let driver = randomElement(drivers);

    if (i <= 18 && activeVehicles.length >= i && availableDrivers.length >= i) {
      tripStatus = TripStatus.DISPATCHED;
      vehicle = activeVehicles[i - 1];
      driver = availableDrivers[i - 1];
      // Update driver status
      await prisma.driver.update({ where: { id: driver.id }, data: { status: DriverStatus.ON_TRIP } });
    } else if (i >= 115) {
      tripStatus = TripStatus.DRAFT;
    } else if (i === 114) {
      tripStatus = TripStatus.CANCELLED;
    }

    const startLoc = randomElement(cities);
    let endLoc = randomElement(cities);
    while (endLoc === startLoc) endLoc = randomElement(cities);

    const plannedStart = randomDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), now);
    const plannedEnd = new Date(plannedStart.getTime() + 1000 * 60 * 60 * randomNumber(12, 72));
    
    const actualStart = (tripStatus === TripStatus.COMPLETED || tripStatus === TripStatus.DISPATCHED) ? new Date(plannedStart.getTime() + randomNumber(-3600000, 3600000)) : null;
    const actualEnd = tripStatus === TripStatus.COMPLETED ? new Date(plannedEnd.getTime() + randomNumber(-3600000, 7200000)) : null;
    
    const distanceKm = randomNumber(150, 1500);
    const startOdometer = Math.max(0, vehicle.currentOdometer - distanceKm - randomNumber(100, 5000));
    const endOdometer = tripStatus === TripStatus.COMPLETED ? startOdometer + distanceKm : null;

    const estimatedCost = distanceKm * randomFloat(15, 25);
    const actualCost = tripStatus === TripStatus.COMPLETED ? estimatedCost * randomFloat(0.9, 1.1) : null;

    trips.push(await prisma.trip.create({
      data: {
        tripNumber: `TRP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(4, '0')}`,
        vehicleId: vehicle.id,
        driverId: driver.id,
        startLocation: startLoc,
        endLocation: endLoc,
        plannedStart,
        plannedEnd,
        actualStart,
        actualEnd,
        startOdometer,
        endOdometer,
        status: tripStatus,
        purpose: 'Cargo Transport',
        cargoWeight: randomFloat(500, 5000),
        plannedDistance: distanceKm,
        distanceKm: tripStatus === TripStatus.COMPLETED ? distanceKm : null,
        estimatedCost,
        actualCost,
        createdBy: superAdmin.id,
        completedBy: tripStatus === TripStatus.COMPLETED ? superAdmin.id : null,
      }
    }));
  }

  // ============================================================================
  // 5. FUEL LOGS
  // ============================================================================
  const fuelLogs = [];
  for (let i = 1; i <= 250; i++) {
    const vehicle = randomElement(vehicles);
    const driver = randomElement(drivers);
    const fuelQuantity = randomFloat(30, 250);
    const pricePerUnit = randomFloat(85, 105);
    
    fuelLogs.push(await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        logDate: randomDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60), now),
        odometerReading: Math.max(0, vehicle.currentOdometer - randomNumber(100, 10000)),
        fuelQuantity,
        cost: fuelQuantity * pricePerUnit,
        efficiency: randomFloat(4, 12),
        fuelStation: `Bharat Petroleum - ${randomElement(cities)}`,
        pricePerUnit,
        receiptNumber: `RCPT-${randomNumber(10000, 99999)}`,
      }
    }));
  }

  // ============================================================================
  // 6. MAINTENANCE
  // ============================================================================
  const maintenanceRecords = [];
  const maintenanceTypes = ['Routine Service', 'Oil Change', 'Brake Replacement', 'Tyre Replacement', 'Battery Check', 'Engine Repair'];
  for (let i = 1; i <= 35; i++) {
    const vehicle = randomElement(vehicles);
    let status = MaintenanceStatus.COMPLETED;
    if (i <= 6) status = MaintenanceStatus.IN_PROGRESS; // 6 active
    else if (i <= 8) status = MaintenanceStatus.SCHEDULED;

    const scheduledDate = randomDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), new Date(now.getTime() + 1000 * 60 * 60 * 24 * 15));
    const completedDate = status === MaintenanceStatus.COMPLETED ? new Date(scheduledDate.getTime() + 1000 * 60 * 60 * randomNumber(24, 72)) : null;

    maintenanceRecords.push(await prisma.maintenance.create({
      data: {
        vehicleId: vehicle.id,
        description: `Periodic maintenance and inspection`,
        scheduledDate,
        completedDate,
        cost: status === MaintenanceStatus.COMPLETED ? randomFloat(5000, 45000) : 0,
        status,
        maintenanceType: randomElement(maintenanceTypes),
        performedBy: `Authorized Service Center - ${randomElement(cities)}`,
        invoiceNumber: status === MaintenanceStatus.COMPLETED ? `INV-M-${randomNumber(1000, 9999)}` : null,
      }
    }));
  }

  // ============================================================================
  // 7. EXPENSES
  // ============================================================================
  const expenses = [];
  const categories = [ExpenseCategory.FUEL, ExpenseCategory.TOLL, ExpenseCategory.PARKING, ExpenseCategory.MAINTENANCE, ExpenseCategory.OTHER];
  
  for (let i = 1; i <= 180; i++) {
    const trip = randomElement(trips);
    let status = ExpenseStatus.APPROVED;
    if (i <= 11) status = ExpenseStatus.PENDING; // 11 pending
    else if (i === 12 || i === 13) status = ExpenseStatus.REJECTED;

    let approverId = null;
    let approvalDate = null;
    
    // Create the expense
    expenses.push(await prisma.expense.create({
      data: {
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        amount: randomFloat(200, 15000),
        category: randomElement(categories),
        description: `Trip operational expense`,
        date: trip.plannedStart,
        status,
        approvedBy: status === ExpenseStatus.APPROVED ? fleetManagers[0].id : null,
        createdBy: superAdmin.id,
        approvalDate: status === ExpenseStatus.APPROVED ? new Date(trip.plannedStart.getTime() + 1000 * 60 * 60 * 24) : null,
      }
    }));
  }

  // ============================================================================
  // 8. ACTIVITY LOGS
  // ============================================================================
  const actions = ['User Login', 'Vehicle Created', 'Trip Dispatched', 'Expense Approved', 'Maintenance Scheduled', 'Driver Updated'];
  const modules = ['AUTH', 'VEHICLES', 'TRIPS', 'EXPENSES', 'MAINTENANCE', 'DRIVERS'];

  const logsData = [];
  for (let i = 1; i <= 500; i++) {
    const actionIndex = randomNumber(0, actions.length - 1);
    logsData.push({
      userId: superAdmin.id,
      action: actions[actionIndex],
      module: modules[actionIndex],
      ipAddress: `192.168.${randomNumber(1, 255)}.${randomNumber(1, 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      timestamp: randomDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), now),
    });
  }
  await prisma.activityLog.createMany({ data: logsData });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n--- SEED COMPLETE ---');
  console.log('✔ 1 Super Admin created');
  console.log('✔ 3 Fleet Managers created');
  console.log('✔ 2 Safety Officers created');
  console.log('✔ 2 Financial Analysts created');
  console.log('✔ 40 Drivers created');
  console.log('✔ 50 Vehicles created');
  console.log('✔ 120 Trips created');
  console.log('✔ 250 Fuel Logs created');
  console.log('✔ 35 Maintenance Records created');
  console.log('✔ 180 Expenses created');
  console.log('✔ 500 Activity Logs created\n');
  console.log('Ready for the Odoo Hackathon Demo!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
