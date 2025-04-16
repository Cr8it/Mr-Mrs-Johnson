import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    let skippedDuplicates = 0;
    let skippedHouseholds = 0;
    const missingHouseholds: string[] = [];

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

        // Check if household exists
        const household = await prisma.household.findFirst({
          where: {
            name: {
              equals: record.Household.trim(),
              mode: 'insensitive'
            }
          },
          include: {
            guests: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Skip if household doesn't exist
        if (!household) {
          if (!missingHouseholds.includes(record.Household.trim())) {
            missingHouseholds.push(record.Household.trim());
            console.log(`Skipping household "${record.Household.trim()}" - not found in database`);
          }
          skippedHouseholds++;
          continue;
        }

        // Check if guest exists
        const existingGuest = household.guests.find(
          guest => guest.name.toLowerCase() === record.Name.trim().toLowerCase()
        );

        // Skip duplicates instead of updating them
        if (existingGuest) {
          console.log(`Skipping duplicate guest: ${record.Name.trim()} in household ${household.name}`);
          skippedDuplicates++;
          continue;
        } else {
          // Determine if child or teenager - using yes/no strings
          const childValues = ['yes', 'y', 'true', '1', 'c', 't'];
          const isChild = record.Child ? childValues.includes(record.Child.toString().trim().toLowerCase()) : false;
          const isTeenager = record.Teenager ? childValues.includes(record.Teenager.toString().trim().toLowerCase()) : false;
          
          // Create new guest
          await prisma.guest.create({
            data: {
              name: record.Name.trim(),
              email: record.Email ? record.Email.trim() : null,
              dietaryNotes: record.DietaryNotes || null,
              householdId: household.id
            }
          });
          
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
      skipped: {
        duplicates: skippedDuplicates,
        households: skippedHouseholds,
        missingHouseholds: missingHouseholds
      },
      warnings: skippedHouseholds > 0 ? [`${skippedHouseholds} guests skipped because their households were not found in the database (${missingHouseholds.join(', ')})`] : [],
      errors: importErrors.length > 0 ? importErrors : undefined
    });
  } catch (error: any) {
    console.error('Text import error:', error);
    return NextResponse.json(
      { error: 'Failed to process import: ' + error.message },
      { status: 500 }
    );
  }
} 