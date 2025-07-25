-- Validate if client fields exist and create them if they don't

-- Check for CompanyName column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Clients' AND column_name = 'CompanyName'
    ) THEN
        ALTER TABLE "Clients" ADD COLUMN "CompanyName" VARCHAR(100) NULL;
    END IF;
END $$;

-- Check for ContactPerson column  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Clients' AND column_name = 'ContactPerson'
    ) THEN
        ALTER TABLE "Clients" ADD COLUMN "ContactPerson" VARCHAR(100) NULL;
    END IF;
END $$;

-- Check for TaxNumber column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Clients' AND column_name = 'TaxNumber'
    ) THEN
        ALTER TABLE "Clients" ADD COLUMN "TaxNumber" VARCHAR(50) NULL;
    END IF;
END $$;

-- Check for Notes column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Clients' AND column_name = 'Notes'
    ) THEN
        ALTER TABLE "Clients" ADD COLUMN "Notes" TEXT NULL;
    END IF;
END $$;
