-- Add new columns to Clients table
ALTER TABLE "Clients" 
ADD COLUMN IF NOT EXISTS "CompanyName" VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS "ContactPerson" VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS "TaxNumber" VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS "Notes" TEXT NULL;

-- Add comment for the migration
COMMENT ON TABLE "Clients" IS 'Added CompanyName, ContactPerson, TaxNumber, and Notes fields on 2024-06-25';

-- Update any existing records to have empty strings rather than nulls (optional)
UPDATE "Clients" 
SET 
  "CompanyName" = '' WHERE "CompanyName" IS NULL,
  "ContactPerson" = '' WHERE "ContactPerson" IS NULL,
  "TaxNumber" = '' WHERE "TaxNumber" IS NULL,
  "Notes" = '' WHERE "Notes" IS NULL;

-- Add constraints (optional - can be adjusted based on your requirements)
ALTER TABLE "Clients" 
ALTER COLUMN "CompanyName" SET DEFAULT '',
ALTER COLUMN "ContactPerson" SET DEFAULT '',
ALTER COLUMN "TaxNumber" SET DEFAULT '',
ALTER COLUMN "Notes" SET DEFAULT '';
