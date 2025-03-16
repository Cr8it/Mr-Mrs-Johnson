-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "weddingDate" DATETIME,
    "venueName" TEXT NOT NULL DEFAULT '',
    "venueAddress" TEXT NOT NULL DEFAULT '',
    "ceremonyTime" TEXT NOT NULL DEFAULT '',
    "receptionTime" TEXT NOT NULL DEFAULT '',
    "primaryColor" TEXT NOT NULL DEFAULT '#d4af37',
    "accentColor" TEXT NOT NULL DEFAULT '#000000',
    "backgroundImage" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("accentColor", "ceremonyTime", "createdAt", "id", "primaryColor", "receptionTime", "updatedAt", "venueAddress", "venueName", "weddingDate") SELECT "accentColor", "ceremonyTime", "createdAt", "id", "primaryColor", "receptionTime", "updatedAt", "venueAddress", "venueName", "weddingDate" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_id_key" ON "Settings"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
