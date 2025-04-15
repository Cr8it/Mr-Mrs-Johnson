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
  console.log('Normalizing record:', record); // Add logging
  Object.keys(record).forEach(key => {
    // Remove extra spaces and convert to proper case
    const cleanKey = key.trim();
    const properKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1).toLowerCase();
    normalized[properKey] = record[key];
    console.log(`Normalized ${key} to ${properKey}`); // Add logging
  });
  return normalized as GuestRecord;
};

const validateCsvRow = (row: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  console.log('Validating row:', row); // Add logging
  
  // First check if row is empty or undefined
  if (!row || Object.keys(row).length === 0) {
    errors.push('Row is empty or undefined');
    return { isValid: false, errors };
  }

  const normalizedRow = normalizeHeaders(row);
  console.log('Normalized row:', normalizedRow); // Add logging

  // Check if required fields exist
  if (!normalizedRow.Name || typeof normalizedRow.Name !== "string" || normalizedRow.Name.trim() === "") {
    errors.push(`Name is required and cannot be empty for row: ${JSON.stringify(normalizedRow)}`);
  }
  if (!normalizedRow.Household || typeof normalizedRow.Household !== "string" || normalizedRow.Household.trim() === "") {
    errors.push(`Household is required and cannot be empty for guest: ${normalizedRow.Name || 'Unknown'}`);
  }

  // Optional fields validation with more flexible handling
  if (normalizedRow.Email && typeof normalizedRow.Email !== "string") {
    errors.push(`Invalid email format for guest: ${normalizedRow.Name}`);
  }

  // More flexible Child/Teenager validation
  if (normalizedRow.Child) {
    const childValue = normalizedRow.Child.toString().toLowerCase().trim();
    console.log(`Child value for ${normalizedRow.Name}:`, childValue); // Add logging
    if (!["yes", "no", "true", "false", "t", "c", "y", "n", ""].includes(childValue)) {
      errors.push(`Invalid Child value "${childValue}" for guest ${normalizedRow.Name}. Must be yes/no/true/false/t/c/y/n or empty`);
    }
  }

  if (normalizedRow.Teenager) {
    const teenValue = normalizedRow.Teenager.toString().toLowerCase().trim();
    console.log(`Teenager value for ${normalizedRow.Name}:`, teenValue); // Add logging
    if (!["yes", "no", "true", "false", "t", "y", "n", ""].includes(teenValue)) {
      errors.push(`Invalid Teenager value "${teenValue}" for guest ${normalizedRow.Name}. Must be yes/no/true/false/t/y/n or empty`);
    }
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
      // Try to detect the delimiter by checking for tabs and commas in the first line
      const firstLine = content.split('\n')[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';
      
      console.log('First line of file:', firstLine);
      console.log('Detected delimiter:', delimiter);
      
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: delimiter,
        relaxColumnCount: true // Allow varying column counts
      });

      console.log('Parsed records count:', records.length);
      console.log('First record sample:', JSON.stringify(records[0], null, 2));

      // Remove any completely empty rows
      records = records.filter(record => 
        Object.values(record).some(value => value && value.toString().trim() !== '')
      );

      // Log all records after filtering
      console.log('Records after filtering:', JSON.stringify(records, null, 2));

      // Normalize headers for all records
      records = records.map(normalizeHeaders);

      // Check if required columns exist
      const requiredColumns = ['Name', 'Household'];
      const missingColumns = requiredColumns.filter(col => 
        !records[0] || !(col in records[0])
      );
      
      if (missingColumns.length > 0) {
        console.log('Found columns:', Object.keys(records[0] || {}));
        console.log('Missing columns:', missingColumns);
        return NextResponse.json(
          {
            error: "Missing required columns",
            details: `Missing columns: ${missingColumns.join(', ')}. Required columns are: Name, Household`,
            example: `Your ${delimiter === '\t' ? 'TSV' : 'CSV'} should have headers: Name${delimiter}Email${delimiter}Household${delimiter}Child${delimiter}Teenager`,
            foundColumns: Object.keys(records[0] || {})
          },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json(
        {
          error: "Failed to parse file",
          details: "Please ensure your file is properly formatted with headers: Name, Email, Household, Child, Teenager (comma or tab separated)",
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          content: content.slice(0, 200) // Show first 200 characters of file
        },
        { status: 400 }
      );
    }

    // Validate each record
    const validationResults = records.map((record, index) => {
      console.log(`\nValidating record ${index + 2}:`, JSON.stringify(record, null, 2));
      const validation = validateCsvRow(record);
      console.log(`Validation result for row ${index + 2}:`, validation);
      return {
        rowNumber: index + 2,
        ...validation,
        record
      };
    });

    const invalidRecords = validationResults.filter(result => !result.isValid);
    if (invalidRecords.length > 0) {
      console.log('Invalid records found:', JSON.stringify(invalidRecords, null, 2));
      return NextResponse.json(
        {
          error: "Invalid records found in file",
          details: invalidRecords.map(record => ({
            rowNumber: record.rowNumber,
            errors: record.errors,
            data: {
              name: record.record.Name,
              household: record.record.Household,
              child: record.record.Child,
              teenager: record.record.Teenager,
              rawRecord: record.record // Include the raw record for debugging
            }
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

    console.log('Household groups created:', Object.keys(householdGroups));

    // Create households and guests
    const results = await Promise.all(
      Object.entries(householdGroups).map(async ([householdName, guests]) => {
        try {
          const household = await prisma.household.create({
            data: {
              name: householdName,
              code: Math.random().toString(36).substring(2, 8).toUpperCase(),
              guests: {
                create: guests.map(guest => ({
                  name: guest.Name,
                  email: guest.Email || null,
                  isChild: guest.Child ? ['yes', 'true', 'y', 't', 'c'].includes(guest.Child.toLowerCase().trim()) : false,
                  isTeenager: guest.Teenager ? ['yes', 'true', 'y', 't'].includes(guest.Teenager.toLowerCase().trim()) : false,
                  mealChoice: null,
                  dietaryNotes: null
                }))
              }
            },
            include: {
              guests: true
            }
          })
          console.log(`Created household ${householdName} with ${household.guests.length} guests`);
          return household;
        } catch (error) {
          console.error(`Error creating household ${householdName}:`, error);
          throw error;
        }
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
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

