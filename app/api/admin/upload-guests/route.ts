import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parse } from 'csv-parse/sync'

interface GuestRecord {
  Name: string
  Email?: string
  Household: string
  Child?: string
  Teenager?: string
}

interface HouseholdGroups {
  [key: string]: GuestRecord[]
}

const normalizeHeaders = (record: any): GuestRecord => {
  // Create a normalized version of the record with correct casing
  const normalized: any = {};
  Object.keys(record).forEach(key => {
    // Remove extra spaces and convert to proper case
    const cleanKey = key.trim();
    const properKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1).toLowerCase();
    normalized[properKey] = record[key];
  });
  return normalized as GuestRecord;
};

const validateCsvRow = (row: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const normalizedRow = normalizeHeaders(row);

  // Check if required fields exist
  if (!normalizedRow.Name || typeof normalizedRow.Name !== "string" || normalizedRow.Name.trim() === "") {
    errors.push("Name is required and cannot be empty");
  }
  if (!normalizedRow.Household || typeof normalizedRow.Household !== "string" || normalizedRow.Household.trim() === "") {
    errors.push("Household is required and cannot be empty");
  }

  // Optional fields validation
  if (normalizedRow.Email && typeof normalizedRow.Email !== "string") {
    errors.push("Email must be a string if provided");
  }
  if (normalizedRow.Child && !["yes", "no", "true", "false", ""].includes(normalizedRow.Child.toLowerCase().trim())) {
    errors.push("Child must be 'yes', 'no', 'true', 'false', or empty");
  }
  if (normalizedRow.Teenager && !["yes", "no", "true", "false", ""].includes(normalizedRow.Teenager.toLowerCase().trim())) {
    errors.push("Teenager must be 'yes', 'no', 'true', 'false', or empty");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file = data.get('file') as File
    const content = await file.text()
    
    let records: any[];
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: '\t' // Use tab as delimiter
      });

      // Normalize headers for all records
      records = records.map(normalizeHeaders);

      // Check if required columns exist
      const requiredColumns = ['Name', 'Household'];
      const missingColumns = requiredColumns.filter(col => 
        !records[0] || !(col in records[0])
      );
      
      if (missingColumns.length > 0) {
        return NextResponse.json(
          {
            error: "Missing required columns",
            details: `Missing columns: ${missingColumns.join(', ')}. Required columns are: Name, Household`,
            example: "Your TSV should have headers: Name\tEmail\tHousehold\tChild\tTeenager",
            foundColumns: Object.keys(records[0] || {})
          },
          { status: 400 }
        );
      }
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Failed to parse TSV",
          details: "Please ensure your TSV is properly formatted and has the correct headers: Name\tEmail\tHousehold\tChild\tTeenager"
        },
        { status: 400 }
      );
    }

    // Validate each record
    const validationResults = records.map((record, index) => ({
      rowNumber: index + 2, // +2 because index 0 is row 2 (after headers)
      ...validateCsvRow(record),
      record
    }));

    const invalidRecords = validationResults.filter(result => !result.isValid);
    if (invalidRecords.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid records found in TSV",
          details: invalidRecords.map(record => ({
            rowNumber: record.rowNumber,
            errors: record.errors,
            data: record.record
          }))
        },
        { status: 400 }
      );
    }

    // Group records by household
    const householdGroups = records.reduce<HouseholdGroups>((acc, record) => {
      const normalizedRecord = normalizeHeaders(record);
      if (!acc[normalizedRecord.Household]) {
        acc[normalizedRecord.Household] = []
      }
      acc[normalizedRecord.Household].push(normalizedRecord)
      return acc
    }, {})

    // Create households and guests
    const results = await Promise.all(
      Object.entries(householdGroups).map(async ([householdName, guests]) => {
        const household = await prisma.household.create({
          data: {
            name: householdName,
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            guests: {
              create: guests.map(guest => ({
                name: guest.Name,
                email: guest.Email || null,
                isChild: guest.Child?.toLowerCase().trim() === 'yes' || guest.Child?.toLowerCase().trim() === 'true',
                isTeenager: guest.Teenager?.toLowerCase().trim() === 'yes' || guest.Teenager?.toLowerCase().trim() === 'true',
                mealChoice: null,
                dietaryNotes: null
              }))
            }
          },
          include: {
            guests: true
          }
        })
        return household
      })
    )

    return NextResponse.json({ 
      success: true,
      households: results,
      totalGuests: results.reduce((sum, household) => sum + household.guests.length, 0)
    })
  } catch (error) {
    console.error("Error uploading guests:", error)
    return NextResponse.json(
      { 
        error: "Failed to upload guest list",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

