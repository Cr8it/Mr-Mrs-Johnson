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
  const normalized: any = {};
  
  // Map common variations of column names
  const headerMappings: { [key: string]: string } = {
    'name': 'Name',
    'email': 'Email',
    'household': 'Household',
    'child': 'Child',
    'teenager': 'Teenager'
  };
  
  Object.entries(record).forEach(([key, value]) => {
    // Clean the key (remove spaces, lowercase)
    const cleanKey = key.trim().toLowerCase();
    // Use mapped header or capitalize first letter
    const properKey = headerMappings[cleanKey] || 
      (cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1));
    normalized[properKey] = value;
  });
  
  return normalized as GuestRecord;
};

const validateCsvRow = (row: any, rowNumber: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // First check if row is empty or undefined
  if (!row || Object.keys(row).length === 0) {
    errors.push(`Row ${rowNumber}: Row is empty or undefined`);
    return { isValid: false, errors };
  }

  const normalizedRow = normalizeHeaders(row);
  console.log(`Validating Row ${rowNumber}:`, JSON.stringify(normalizedRow));

  // Required fields validation
  if (!normalizedRow.Name || typeof normalizedRow.Name !== "string" || normalizedRow.Name.trim() === "") {
    errors.push(`Row ${rowNumber}: Name is required and cannot be empty`);
  }
  if (!normalizedRow.Household || typeof normalizedRow.Household !== "string" || normalizedRow.Household.trim() === "") {
    errors.push(`Row ${rowNumber}: Household is required and cannot be empty for guest: ${normalizedRow.Name || 'Unknown'}`);
  }

  // Email validation (optional)
  if (normalizedRow.Email && normalizedRow.Email.trim() !== "") {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedRow.Email.trim())) {
      errors.push(`Row ${rowNumber}: Invalid email format "${normalizedRow.Email}" for guest: ${normalizedRow.Name}`);
    }
  }

  // Child/Teenager validation - accept various formats
  const validFlags = ['yes', 'true', 'y', 't', '1'];
  
  if (normalizedRow.Child) {
    const childValue = normalizedRow.Child.toString().toLowerCase().trim();
    if (childValue !== '' && !validFlags.includes(childValue)) {
      errors.push(`Row ${rowNumber}: Invalid Child value "${childValue}" for guest ${normalizedRow.Name}`);
    }
  }

  if (normalizedRow.Teenager) {
    const teenValue = normalizedRow.Teenager.toString().toLowerCase().trim();
    if (teenValue !== '' && !validFlags.includes(teenValue)) {
      errors.push(`Row ${rowNumber}: Invalid Teenager value "${teenValue}" for guest ${normalizedRow.Name}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: Request) {
  try {
    console.log("Starting guest list upload process");
    const data = await request.formData();
    const file = data.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const content = await file.text();
    
    let records: any[];
    try {
      // Try to detect the delimiter by checking for tabs and commas in the first line
      const firstLine = content.split('\n')[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';
      
      console.log('First line:', firstLine);
      console.log('Using delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');
      
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: delimiter,
        relaxColumnCount: true
      });
      
      console.log(`Parsed ${records.length} records from file`);

      // Remove any completely empty rows
      const beforeFilter = records.length;
      records = records.filter(record => 
        Object.values(record).some(value => value && value.toString().trim() !== '')
      );
      console.log(`Removed ${beforeFilter - records.length} completely empty rows`);

      // Normalize headers for all records
      records = records.map(normalizeHeaders);

      // Check for required columns
      const requiredColumns = ['Name', 'Household'];
      const firstRecord = records[0] || {};
      console.log("First record columns:", Object.keys(firstRecord));
      
      const missingColumns = requiredColumns.filter(col => 
        !Object.keys(firstRecord).some(key => 
          key.toLowerCase() === col.toLowerCase()
        )
      );
      
      if (missingColumns.length > 0) {
        return NextResponse.json(
          {
            error: "Missing required columns",
            details: `Missing columns: ${missingColumns.join(', ')}`,
            foundColumns: Object.keys(firstRecord),
            firstRecord: firstRecord
          },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json(
        {
          error: "Failed to parse file",
          details: parseError instanceof Error ? parseError.message : String(parseError),
          firstFewLines: content.split('\n').slice(0, 5).join('\n')
        },
        { status: 400 }
      );
    }

    // Validate each record
    console.log("Validating all records...");
    const validationResults = records.map((record, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row
      const validation = validateCsvRow(record, rowNumber);
      return {
        rowNumber,
        ...validation,
        record,
        displayData: {
          name: record.Name || record.name || "",
          household: record.Household || record.household || "",
          email: record.Email || record.email || "",
          child: record.Child || record.child || "",
          teenager: record.Teenager || record.teenager || ""
        }
      };
    });

    const invalidRecords = validationResults.filter(result => !result.isValid);
    if (invalidRecords.length > 0) {
      console.log(`Found ${invalidRecords.length} invalid records`);
      
      // Enhanced error details with original row data
      const errorDetails = invalidRecords.map(record => ({
        rowNumber: record.rowNumber,
        errors: record.errors,
        data: record.displayData
      }));
      
      console.log("Error details:", JSON.stringify(errorDetails, null, 2));
      
      return NextResponse.json(
        {
          error: "Invalid records found in file",
          message: "Please fix the following rows in your spreadsheet:",
          details: errorDetails,
          errorSummary: invalidRecords.map(r => 
            `Row ${r.rowNumber}: ${r.errors.join('; ')}`
          ).join('\n')
        },
        { status: 400 }
      );
    }

    // Group records by household
    console.log("Grouping records by household...");
    const householdGroups = records.reduce<HouseholdGroups>((acc, record) => {
      const normalizedRecord = normalizeHeaders(record);
      const householdName = normalizedRecord.Household.trim();
      if (!acc[householdName]) {
        acc[householdName] = [];
      }
      acc[householdName].push(normalizedRecord);
      return acc;
    }, {});

    console.log(`Found ${Object.keys(householdGroups).length} unique households`);

    // Create households and guests
    console.log("Creating households and guests in database...");
    const results = await Promise.all(
      Object.entries(householdGroups).map(async ([householdName, guests]) => {
        try {
          console.log(`Creating household "${householdName}" with ${guests.length} guests`);
          const household = await prisma.household.create({
            data: {
              name: householdName,
              code: Math.random().toString(36).substring(2, 8).toUpperCase(),
              guests: {
                create: guests.map(guest => ({
                  name: guest.Name.trim(),
                  email: guest.Email?.trim() || null,
                  isChild: guest.Child ? ['yes', 'true', 'y', 't', '1'].includes(guest.Child.toLowerCase().trim()) : false,
                  isTeenager: guest.Teenager ? ['yes', 'true', 'y', 't', '1'].includes(guest.Teenager.toLowerCase().trim()) : false
                }))
              }
            },
            include: {
              guests: true
            }
          });
          return household;
        } catch (error) {
          console.error(`Error creating household ${householdName}:`, error);
          throw error;
        }
      })
    );

    const totalGuests = results.reduce((sum, household) => sum + household.guests.length, 0);
    console.log(`Successfully created ${results.length} households with ${totalGuests} total guests`);

    return NextResponse.json({ 
      success: true,
      households: results,
      totalGuests: totalGuests
    });
  } catch (error) {
    console.error("Error uploading guests:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload guest list",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

