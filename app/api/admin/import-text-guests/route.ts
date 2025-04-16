import { NextResponse } from 'next/server'
import { prisma } from "@/lib/db"
import { unstable_noStore as noStore } from 'next/cache'
import { revalidatePath } from 'next/cache'

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Interface for guest data
interface GuestRecord {
  name: string;
  household: string;
  email: string | null;
  isChild: boolean;
  isTeenager: boolean;
  dietaryNotes: string | null;
}

export async function POST(request: Request) {
  noStore()
  
  try {
    console.log('Starting text guest import process')
    const startTime = Date.now()
    
    // Get the data from the request
    const data = await request.json()
    const guests = data.guests as GuestRecord[]
    
    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ 
        error: 'No valid guest data provided',
      }, { status: 400 })
    }
    
    console.log(`Processing ${guests.length} guests from pasted data`)
    
    // Group guests by household to be more efficient
    const householdMap = new Map<string, {
      name: string,
      guests: GuestRecord[]
    }>()
    
    // Group guests
    for (const guest of guests) {
      // Basic validation
      if (!guest.name || !guest.household) continue
      
      const householdKey = guest.household.toLowerCase()
      
      if (!householdMap.has(householdKey)) {
        householdMap.set(householdKey, {
          name: guest.household, // Use original casing
          guests: [guest]
        })
      } else {
        householdMap.get(householdKey)?.guests.push(guest)
      }
    }
    
    console.log(`Grouped into ${householdMap.size} households`)
    
    // Process households and guests
    let processedGuests = 0
    let skippedDuplicates = 0
    let skippedHouseholds = 0
    const missingHouseholds: string[] = []
    const errors: string[] = []
    
    // Process each household and its guests
    for (const [key, household] of householdMap.entries()) {
      try {
        // Check if household already exists
        const existingHousehold = await prisma.household.findFirst({
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
        })
        
        // Skip if household doesn't exist
        if (!existingHousehold) {
          console.log(`Skipping household "${household.name}" - not found in database`)
          skippedHouseholds++
          missingHouseholds.push(household.name)
          continue
        }
        
        // Process each guest in the household
        for (const guest of household.guests) {
          try {
            // Check if guest already exists in this household
            const existingGuest = existingHousehold.guests.find(g => 
              g.name.toLowerCase() === guest.name.toLowerCase()
            )
            
            // Skip if guest already exists
            if (existingGuest) {
              console.log(`Skipping duplicate guest: ${guest.name} in household ${household.name}`)
              skippedDuplicates++
              continue
            }
            
            // Create the guest
            await prisma.guest.create({
              data: {
                name: guest.name,
                email: guest.email || null,
                dietaryNotes: guest.dietaryNotes || null,
                householdId: existingHousehold.id
              }
            })
            processedGuests++
          } catch (error) {
            console.error(`Error creating guest ${guest.name}:`, error)
            errors.push(`Failed to create guest ${guest.name} in household ${household.name}`)
          }
        }
      } catch (error) {
        console.error(`Error processing household ${household.name}:`, error)
        errors.push(`Failed to process household ${household.name}`)
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Import completed in ${totalTime}ms. Added ${processedGuests} guests to existing households. Skipped ${skippedDuplicates} duplicates and ${skippedHouseholds} households that don't exist.`)
    
    // Revalidate the guests page
    revalidatePath('/admin/guests')
    
    // Return success response with summary and any errors
    if (errors.length > 0 || skippedHouseholds > 0) {
      return NextResponse.json({ 
        warning: errors.length > 0 ? 'Some guests could not be imported' : 
                 skippedHouseholds > 0 ? 'Some households were not found in the database' : '',
        processed: {
          guests: processedGuests
        },
        skipped: {
          duplicates: skippedDuplicates,
          households: skippedHouseholds,
          missingHouseholds: missingHouseholds
        },
        warnings: skippedHouseholds > 0 ? [`${skippedHouseholds} households were not found in the database: ${missingHouseholds.join(', ')}`] : [],
        errors: errors.length > 0 ? errors : undefined
      }, { status: 207 }) // 207 Multi-Status
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Added ${processedGuests} guests to existing households${skippedDuplicates > 0 ? `, skipped ${skippedDuplicates} duplicates` : ''}`,
      processed: {
        guests: processedGuests
      },
      skipped: {
        duplicates: skippedDuplicates,
        households: skippedHouseholds
      },
      processingTime: `${(totalTime/1000).toFixed(2)} seconds`
    })
    
  } catch (error: any) {
    console.error('Error in import-text-guests route:', error)
    
    return NextResponse.json({ 
      error: 'Failed to process guest data',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
} 