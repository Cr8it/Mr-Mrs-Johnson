import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { records } = await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records provided' },
        { status: 400 }
      );
    }

    console.log(`Processing ${records.length} records from text import`);

    const importErrors: string[] = [];
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because we're 0-indexed but users think in 1-indexed, and we skip the header row

      try {
        // Basic validation
        if (!record.Name?.trim()) {
          importErrors.push(`Row ${rowNumber}: Name is required`);
          continue;
        }

        if (!record.Household?.trim()) {
          importErrors.push(`Row ${rowNumber}: Household is required`);
          continue;
        }

        // Check if household exists, create if not
        let household = await prisma.household.findFirst({
          where: {
            name: {
              equals: record.Household.trim(),
              mode: 'insensitive'
            }
          }
        });

        if (!household) {
          household = await prisma.household.create({
            data: {
              name: record.Household.trim(),
              code: generateRandomCode()
            }
          });
          console.log(`Created new household: ${household.name} with code ${household.code}`);
        }

        // Check if guest exists
        const existingGuest = await prisma.guest.findFirst({
          where: {
            name: {
              equals: record.Name.trim(),
              mode: 'insensitive'
            },
            householdId: household.id
          }
        });

        // Determine if child or teenager - using yes/no strings
        const childValues = ['yes', 'y', 'true', '1', 'c', 't'];
        const isChild = record.Child ? childValues.includes(record.Child.toString().trim().toLowerCase()) : false;
        const isTeenager = record.Teenager ? childValues.includes(record.Teenager.toString().trim().toLowerCase()) : false;

        // Skip duplicates instead of updating them
        if (existingGuest) {
          console.log(`Skipping duplicate guest: ${record.Name.trim()} in household ${household.name}`);
          skippedCount++;
          continue;
        } else {
          // Create new guest using prisma raw query to avoid type issues
          await prisma.$executeRaw`
            INSERT INTO "Guest" 
            ("id", "name", "householdId", "email", "isChild", "isTeenager", "createdAt", "updatedAt") 
            VALUES 
            (${crypto.randomUUID()}, ${record.Name.trim()}, ${household.id}, ${record.Email ? record.Email.trim() : null}, ${isChild}, ${isTeenager}, NOW(), NOW())
          `;
          
          importedCount++;
        }
      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, error);
        importErrors.push(`Row ${rowNumber}: ${error.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: importErrors
    });
  } catch (error: any) {
    console.error('Text import error:', error);
    return NextResponse.json(
      { error: 'Failed to process import: ' + error.message },
      { status: 500 }
    );
  }
} 