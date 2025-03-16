-- CreateTable
CREATE TABLE "GuestActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestActivity_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GuestActivity_guestId_idx" ON "GuestActivity"("guestId");

-- CreateIndex
CREATE INDEX "GuestActivity_createdAt_idx" ON "GuestActivity"("createdAt");
