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
    let skippedDuplicates = 0;
    let createdHouseholds = 0;

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

        if (!household) {
          household = await prisma.household.create({
            data: {
              name: record.Household.trim(),
              code: generateRandomCode()
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
          console.log(`Created new household: ${household.name} with code ${household.code}`);
          createdHouseholds++;
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
      householdsCreated: createdHouseholds,
      skipped: {
        duplicates: skippedDuplicates
      },
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