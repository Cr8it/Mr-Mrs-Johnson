-- CreateTable
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

-- InsertDefaultSettings
INSERT INTO "Settings" ("id") VALUES (1);