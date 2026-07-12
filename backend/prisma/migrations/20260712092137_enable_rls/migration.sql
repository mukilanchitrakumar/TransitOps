-- Enable Row Level Security (RLS) on all application tables to prevent anonymous API access
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "maintenances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fuel_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;

-- Apply IF EXISTS to ensure compatibility with Prisma's temporary shadow database checks
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;