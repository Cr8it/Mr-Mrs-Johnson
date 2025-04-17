-- Add StatisticsCache table
CREATE TABLE "StatisticsCache" (
    "id" TEXT NOT NULL,
    "totalGuests" INTEGER NOT NULL DEFAULT 0,
    "respondedGuests" INTEGER NOT NULL DEFAULT 0,
    "attendingGuests" INTEGER NOT NULL DEFAULT 0,
    "notAttendingGuests" INTEGER NOT NULL DEFAULT 0,
    "mealStats" JSONB NOT NULL DEFAULT '{}',
    "dessertStats" JSONB NOT NULL DEFAULT '{}',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StatisticsCache_pkey" PRIMARY KEY ("id")
);

-- Create index on lastUpdated
CREATE INDEX "StatisticsCache_lastUpdated_idx" ON "StatisticsCache"("lastUpdated");

-- Add isChildOption to MealOption if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='MealOption' AND column_name='isChildOption') THEN
        ALTER TABLE "MealOption" ADD COLUMN "isChildOption" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add isChildOption to DessertOption if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='DessertOption' AND column_name='isChildOption') THEN
        ALTER TABLE "DessertOption" ADD COLUMN "isChildOption" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$; 