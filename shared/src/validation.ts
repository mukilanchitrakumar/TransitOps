import { z } from 'zod';

// User Roles
export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'FLEET_MANAGER',
  'DRIVER',
  'SAFETY_OFFICER',
  'FINANCIAL_ANALYST',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Vehicle Categories
export const VehicleCategorySchema = z.enum(['SEDAN', 'SUV', 'VAN', 'TRUCK']);
export type VehicleCategory = z.infer<typeof VehicleCategorySchema>;

// Vehicle Statuses
export const VehicleStatusSchema = z.enum([
  'ACTIVE',
  'ON_TRIP',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'RETIRED',
]);
export type VehicleStatus = z.infer<typeof VehicleStatusSchema>;

// Driver Statuses
export const DriverStatusSchema = z.enum(['ACTIVE', 'ON_TRIP', 'SUSPENDED', 'INACTIVE']);
export type DriverStatus = z.infer<typeof DriverStatusSchema>;

// Trip Statuses
export const TripStatusSchema = z.enum(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']);
export type TripStatus = z.infer<typeof TripStatusSchema>;

// Maintenance Statuses
export const MaintenanceStatusSchema = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>;

// Expense Categories
export const ExpenseCategorySchema = z.enum([
  'FUEL',
  'TOLL',
  'PARKING',
  'FOOD',
  'MAINTENANCE',
  'ACCOMMODATION',
  'OTHER',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

// Expense Statuses
export const ExpenseStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>;

// Vehicle Validation Schemas
export const VehicleCreateSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  name: z.string().optional().or(z.literal('')),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900).max(2100),
  category: VehicleCategorySchema,
  currentOdometer: z.coerce.number().int().nonnegative('Odometer cannot be negative').default(0),
  capacity: z.coerce.number().int().positive('Capacity must be positive').default(5),
  fuelType: z.string().default('GASOLINE'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  vinNumber: z.string().optional().or(z.literal('')),
  acquisitionCost: z.coerce.number().nonnegative().optional().nullable(),
});

export const VehicleUpdateSchema = VehicleCreateSchema.partial().extend({
  status: VehicleStatusSchema.optional(),
  nextServiceOdometer: z.coerce.number().int().nonnegative().optional(),
  nextServiceDate: z.string().datetime().optional().nullable(),
});

// Driver Validation Schemas
export const DriverCreateSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  fullName: z.string().min(1, 'Full name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.string().optional().nullable(),
  licenseExpiry: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: 'Invalid license expiry date',
  }),
  phone: z.string().min(1, 'Phone is required'),
  status: DriverStatusSchema.default('ACTIVE'),
  safetyScore: z.coerce.number().min(0).max(100).optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const DriverUpdateSchema = DriverCreateSchema.partial();

// Trip Validation Schemas
export const TripCreateSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  driverId: z.string().uuid('Invalid driver ID'),
  startLocation: z.string().min(1, 'Start location is required'),
  endLocation: z.string().min(1, 'End location is required'),
  plannedStart: z.string().datetime({ message: 'Invalid planned start date' }),
  plannedEnd: z.string().datetime({ message: 'Invalid planned end date' }),
  purpose: z.string().optional().nullable(),
  cargoWeight: z.coerce.number().nonnegative().optional().nullable(),
  plannedDistance: z.coerce.number().nonnegative().optional().nullable(),
  estimatedCost: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const TripUpdateSchema = TripCreateSchema.partial().extend({
  status: TripStatusSchema.optional(),
  actualStart: z.string().datetime().optional().nullable(),
  actualEnd: z.string().datetime().optional().nullable(),
  startOdometer: z.coerce.number().int().nonnegative().optional().nullable(),
  endOdometer: z.coerce.number().int().nonnegative().optional().nullable(),
  actualCost: z.coerce.number().nonnegative().optional().nullable(),
  distanceKm: z.coerce.number().nonnegative().optional().nullable(),
  completedBy: z.string().uuid().optional().nullable(),
});

// Maintenance Validation Schemas
export const MaintenanceCreateSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  description: z.string().min(1, 'Description is required'),
  scheduledDate: z.string().datetime({ message: 'Invalid scheduled date' }),
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  cost: z.coerce.number().nonnegative().default(0.00),
  performedBy: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const MaintenanceUpdateSchema = MaintenanceCreateSchema.partial().extend({
  status: MaintenanceStatusSchema.optional(),
  completedDate: z.string().datetime().optional().nullable(),
});

// Fuel Log Validation Schemas
export const FuelLogCreateSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  driverId: z.string().uuid('Invalid driver ID'),
  logDate: z.string().datetime().optional(),
  odometerReading: z.coerce.number().int().nonnegative('Odometer reading must be non-negative'),
  fuelQuantity: z.coerce.number().positive('Fuel quantity must be positive'),
  cost: z.coerce.number().nonnegative('Cost cannot be negative'),
  fuelStation: z.string().optional().nullable(),
  pricePerUnit: z.coerce.number().nonnegative().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Expense Validation Schemas
export const ExpenseCreateSchema = z.object({
  tripId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: ExpenseCategorySchema,
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expense date',
  }),
  attachmentUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});
