-- Drop and recreate Settings table
DROP TABLE IF EXISTS "Settings";

CREATE TABLE "Settings" (
	"id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
	"weddingDate" DATETIME,
	"venueName" TEXT NOT NULL DEFAULT '',
	"venueAddress" TEXT NOT NULL DEFAULT '',
	"ceremonyTime" TEXT NOT NULL DEFAULT '',
	"receptionTime" TEXT NOT NULL DEFAULT '',
	"primaryColor" TEXT NOT NULL DEFAULT '#d4af37',
	"accentColor" TEXT NOT NULL DEFAULT '#000000',
	"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "Settings_id_unique" UNIQUE ("id")
);

-- Insert default settings with all fields
INSERT INTO "Settings" (
	"id", 
	"weddingDate", 
	"venueName", 
	"venueAddress", 
	"ceremonyTime", 
	"receptionTime", 
	"primaryColor", 
	"accentColor",
	"createdAt",
	"updatedAt"
) VALUES (
	1, 
	NULL, 
	'', 
	'', 
	'', 
	'', 
	'#d4af37', 
	'#000000',
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
);

-- Create trigger to update the updatedAt timestamp
CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
AFTER UPDATE ON "Settings"
BEGIN
	UPDATE "Settings" SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;