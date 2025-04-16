import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/db"
import { unstable_noStore as noStore } from 'next/cache'
import { parse } from 'csv-parse/sync'
import { revalidatePath } from 'next/cache'

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Much longer timeout - 5 minutes
const TIMEOUT_MS = 300000; 
// Larger batch size for more efficiency
const BATCH_SIZE = 100; 

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
    
    // OPTIMIZATION: Create a map of unique households with their guests grouped together
    const householdMap = new Map<string, {
      name: string, 
      code: string,
      guests: GuestRecord[]
    }>();
    
    // Group guests by household
    for (const record of validRecords) {
      const householdName = record.household.toLowerCase();
      
      if (!householdMap.has(householdName)) {
        // Generate code once per household
        householdMap.set(householdName, {
          name: record.household, // Keep original casing
          code: generateRandomCode(),
          guests: [record]
        });
      } else {
        // Add to existing household
        householdMap.get(householdName)?.guests.push(record);
      }
    }
    
    console.log(`Grouped into ${householdMap.size} unique households`);
    
    // CRITICAL OPTIMIZATION: Process in just a few larger transactions
    // This greatly reduces database roundtrips and query planning overhead
    const households = Array.from(householdMap.values());
    const totalHouseholds = households.length;
    let processedHouseholds = 0;
    let processedGuests = 0;
    let skippedDuplicates = 0;
    
    // Use a smaller number of much larger transactions - this is more efficient
    // for the database and reduces overhead dramatically
    for (let i = 0; i < households.length; i += BATCH_SIZE) {
      const batch = households.slice(i, i + BATCH_SIZE);
      const batchStart = Date.now();
      
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(households.length/BATCH_SIZE)}`);
      
      try {
        // Process each household in the batch
        for (const household of batch) {
          // Check if household already exists in the database
          let existingHousehold = await prisma.household.findFirst({
            where: {
              name: {
                equals: household.name,
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
          
          // Create the household if it doesn't exist
          if (!existingHousehold) {
            existingHousehold = await prisma.household.create({
              data: {
                name: household.name,
                code: household.code
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
            processedHouseholds++;
          }
          
          // Process each guest in the household
          for (const guest of household.guests) {
            // Check if guest already exists in this household
            const existingGuest = existingHousehold.guests.find(g => 
              g.name.toLowerCase() === guest.name.toLowerCase()
            );
            
            // Skip if guest already exists
            if (existingGuest) {
              console.log(`Skipping duplicate guest: ${guest.name} in household ${household.name}`);
              skippedDuplicates++;
              continue;
            }
            
            // Create the guest
            try {
              await prisma.guest.create({
                data: {
                  name: guest.name,
                  email: guest.email,
                  dietaryNotes: guest.dietaryNotes,
                  householdId: existingHousehold.id
                }
              });
              processedGuests++;
            } catch (error) {
              console.error(`Error creating guest ${guest.name}:`, error);
              errors.push(`Failed to create guest ${guest.name} in household ${household.name}`);
            }
          }
        }
        
        const batchTime = Date.now() - batchStart;
        console.log(`Batch completed in ${batchTime}ms. Progress: ${processedHouseholds}/${totalHouseholds} households`);
        
      } catch (error) {
        console.error('Error during batch processing:', error);
        // Return partial success information if we've made progress
        if (processedHouseholds > 0) {
          return NextResponse.json({ 
            warning: 'The operation was partially successful but encountered an error.',
            processed: {
              households: processedHouseholds,
              guests: processedGuests
            },
            skipped: {
              duplicates: skippedDuplicates
            },
            total: {
              households: totalHouseholds,
              guests: validRecords.length
            },
            errors: errors.length > 0 ? errors : undefined,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 207 }); // 207 Multi-Status
        }
        
        return NextResponse.json({ 
          error: 'Failed to process upload',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Upload completed in ${totalTime}ms. Created ${processedHouseholds} households and ${processedGuests} guests. Skipped ${skippedDuplicates} duplicates.`);
    
    // Revalidate the guests page
    revalidatePath('/admin/guests');
    
    // Return success response with summary
    return NextResponse.json({ 
      success: true,
      message: `Successfully imported ${processedGuests} guests across ${processedHouseholds} households${skippedDuplicates > 0 ? `, skipped ${skippedDuplicates} duplicates` : ''}`,
      processed: {
        households: processedHouseholds,
        guests: processedGuests
      },
      skipped: {
        duplicates: skippedDuplicates
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
  }
}

