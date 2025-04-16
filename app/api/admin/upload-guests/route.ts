import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/db"
import { unstable_noStore as noStore } from 'next/cache'
import { parse } from 'csv-parse/sync'
import { revalidatePath } from 'next/cache'

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Adjust the timeout to match the Vercel configuration (60s)
export const maxDuration = 60;

// Reduce batch size to process fewer records at once but more efficiently
const BATCH_SIZE = 25; // Reduced from 100

// Define types for better type safety
interface GuestRecord {
  name: string;
  household: string;
  email: string | null;
  isChild: boolean;
  isTeenager: boolean;
  dietaryNotes: string | null;
}

export async function POST(request: NextRequest) {
  noStore()
  
  try {
    console.log('Starting guest upload process with optimized handler')
    const startTime = Date.now()
    
    // Check if request is multipart form data
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    // Get the form data and extract the file
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Add file size check and logging
    const fileSizeInMB = file.size / (1024 * 1024)
    console.log(`Processing file of size: ${fileSizeInMB.toFixed(2)} MB`)

    // Parse the CSV file
    const fileContent = await file.text()
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      skip_records_with_empty_values: true // Skip completely empty records
    })

    console.log(`Parsed ${records.length} records from CSV`)
    
    // Validate and clean up records - do this ONCE up front to avoid repeated work
    const validRecords: GuestRecord[] = []
    const errors: string[] = []
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNum = i + 2 // +2 because row 1 is headers, and we're 0-indexed
      
      // Skip completely empty rows
      if (!record || Object.values(record).every(v => !v || String(v).trim() === '')) {
        continue
      }
      
      // Basic validation
      if (!record.Name || record.Name.trim() === '') {
        errors.push(`Row ${rowNum}: Missing name`)
        continue
      }
      
      if (!record.Household || record.Household.trim() === '') {
        errors.push(`Row ${rowNum}: Missing household name`)
        continue
      }
      
      // Clean up and transform record
      const cleanedRecord: GuestRecord = {
        name: record.Name.trim(),
        household: record.Household.trim(),
        email: record.Email ? record.Email.trim() : null,
        isChild: record.Child === 'C' || record.Child === 'yes' || record.Child === 'Y' || record.Child === 'true' || false,
        isTeenager: record.Teenager === 'T' || record.Teenager === 'yes' || record.Teenager === 'Y' || record.Teenager === 'true' || false,
        dietaryNotes: record.DietaryRequirements || null
      }
      
      validRecords.push(cleanedRecord)
    }

    if (validRecords.length === 0) {
      return NextResponse.json({ 
        error: 'No valid records found in the CSV', 
        details: errors 
      }, { status: 400 })
    }

    console.log(`Found ${validRecords.length} valid records, proceeding with import`)
    
    // Add more granular logging
    console.log(`Starting to process ${validRecords.length} records`);
    
    // Group guests by household
    const householdMap = new Map<string, GuestRecord[]>();
    
    for (const record of validRecords) {
      if (!record.household) {
        console.error("Record missing household:", record);
        throw new Error(`Record for ${record.name || "unknown"} is missing a household name`);
      }
      
      if (!householdMap.has(record.household)) {
        householdMap.set(record.household, []);
      }
      householdMap.get(record.household)!.push(record);
    }
    
    console.log(`Grouped into ${householdMap.size} households`);

    // Process in smaller batches with checkpoints
    const households = Array.from(householdMap.entries());
    const results: ProcessingResult[] = [];
    const errors: string[] = [];
    let processedHouseholds = 0;
    
    // Process in smaller chunks with timing logs
    for (let i = 0; i < households.length; i += BATCH_SIZE) {
      const batchStartTime = Date.now();
      const batch = households.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(households.length/BATCH_SIZE)} (${batch.length} households)`);
      
      try {
        const batchResults = await processHouseholdBatch(batch, prisma);
        results.push(...batchResults);
        processedHouseholds += batch.length;
        console.log(`Batch completed in ${Date.now() - batchStartTime}ms. Total processed: ${processedHouseholds}/${households.length} households`);
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
        if (error instanceof Error) {
          errors.push(`Batch error: ${error.message}`);
        } else {
          errors.push(`Unknown batch error occurred`);
        }
        // Continue processing next batch instead of failing entirely
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Upload completed in ${totalTime}ms. Created ${processedHouseholds} households and ${results.length} guests. Skipped ${errors.length} errors.`);
    
    // Revalidate the guests page
    revalidatePath('/admin/guests');
    
    // Return success response with summary
    return NextResponse.json({ 
      success: true,
      message: `Successfully imported ${results.length} guests across ${processedHouseholds} households${errors.length > 0 ? `, skipped ${errors.length} errors` : ''}`,
      processed: {
        households: processedHouseholds,
        guests: results.length
      },
      skipped: {
        errors: errors.length > 0 ? errors : undefined
      },
      processingTime: `${(totalTime/1000).toFixed(2)} seconds`
    });
    
  } catch (error: any) {
    console.error('Error in upload-guests route:', error);
    
    // Check if it's a timeout error
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({ 
        error: 'The server took too long to process the request.',
        suggestion: 'Please contact support as this indicates a server configuration issue.',
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to process upload',
      message: error.message || 'Unknown error'
    }, { status: 500 });
  } finally {
    console.log(`Total upload processing time: ${Date.now() - startTime}ms`);
  }
}

// Update the processHouseholdBatch function to be more efficient
async function processHouseholdBatch(
  householdEntries: [string, GuestRecord[]][],
  db: PrismaClient
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  for (const [householdName, members] of householdEntries) {
    const batchStartTime = Date.now();
    try {
      // Generate a unique code for the household
      const code = generateRandomCode();
      
      // Create or update the household
      const household = await db.household.upsert({
        where: { name: householdName },
        update: {},
        create: {
          name: householdName,
          code: code,
        },
      });

      // Log time for household creation
      console.log(`Household "${householdName}" processed in ${Date.now() - batchStartTime}ms`);
      
      // Prepare guests for this household
      for (const member of members) {
        try {
          const guest = await db.guest.create({
            data: {
              name: member.name,
              email: member.email || null,
              isChild: member.isChild || false,
              isTeenager: member.isTeenager || false,
              householdId: household.id,
            },
          });
          
          results.push({
            name: member.name,
            householdName: householdName,
            success: true,
          });
        } catch (error) {
          console.error(`Error creating guest ${member.name}:`, error);
          results.push({
            name: member.name,
            householdName: householdName,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } catch (error) {
      console.error(`Error processing household ${householdName}:`, error);
      for (const member of members) {
        results.push({
          name: member.name,
          householdName: householdName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }
  
  return results;
}

