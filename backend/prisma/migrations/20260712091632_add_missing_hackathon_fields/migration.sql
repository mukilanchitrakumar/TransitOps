-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "license_category" TEXT;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "cargo_weight" DOUBLE PRECISION,
ADD COLUMN     "planned_distance" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "acquisition_cost" DECIMAL(10,2),
ADD COLUMN     "name" TEXT;
