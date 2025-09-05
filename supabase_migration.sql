-- Supabase Migration Script
-- This script creates all the necessary tables for the Nails Booking App

-- Create enum for appointment status (if not exists)
DO $$ BEGIN
    CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Customer table (if not exists)
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "preferences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Create Service table (if not exists)
CREATE TABLE IF NOT EXISTS "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isactive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- Create Employee table (if not exists)
CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "specialties" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- Create EmployeeService table (if not exists)
CREATE TABLE IF NOT EXISTS "EmployeeService" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeService_pkey" PRIMARY KEY ("id")
);

-- Create Appointment table (if not exists)
CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "totalDuration" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- Create AppointmentService table (if not exists)
CREATE TABLE IF NOT EXISTS "AppointmentService" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeService_employeeId_serviceId_key" ON "EmployeeService"("employeeId", "serviceId");
CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentService_appointmentId_serviceId_key" ON "AppointmentService"("appointmentId", "serviceId");

-- Add foreign key constraints (if not exists)
-- First add constraints that don't depend on other tables
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'EmployeeService_employeeId_fkey') THEN
        ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'EmployeeService_serviceId_fkey') THEN
        ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Appointment_customerId_fkey') THEN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Appointment_employeeId_fkey') THEN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AppointmentService_appointmentId_fkey') THEN
        ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AppointmentService_serviceId_fkey') THEN
        ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Insert some sample data (safe inserts)
INSERT INTO "Service" ("id", "name", "description", "duration", "price", "createdAt", "updatedAt") VALUES
('srv_1', 'Manicure', 'Basic manicure service', 30, 25.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('srv_2', 'Pedicure', 'Basic pedicure service', 45, 35.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('srv_3', 'Gel Nails', 'Gel nail application', 60, 45.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('srv_4', 'Nail Art', 'Custom nail art design', 90, 60.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Employee" ("id", "name", "email", "phone", "isActive", "createdAt", "updatedAt") VALUES
('emp_1', 'Maria Papadopoulou', 'maria@nailsalon.gr', '+30 210 1234567', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('emp_2', 'Anna Georgiou', 'anna@nailsalon.gr', '+30 210 1234568', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Link employees with services (safe inserts)
INSERT INTO "EmployeeService" ("id", "employeeId", "serviceId", "createdAt") VALUES
('es_1', 'emp_1', 'srv_1', CURRENT_TIMESTAMP),
('es_2', 'emp_1', 'srv_2', CURRENT_TIMESTAMP),
('es_3', 'emp_1', 'srv_3', CURRENT_TIMESTAMP),
('es_4', 'emp_2', 'srv_1', CURRENT_TIMESTAMP),
('es_5', 'emp_2', 'srv_3', CURRENT_TIMESTAMP),
('es_6', 'emp_2', 'srv_4', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;