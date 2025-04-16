import { NextResponse } from 'next/server'
import { prisma } from "@/lib/db"
import { unstable_noStore as noStore } from 'next/cache'
import { revalidatePath } from 'next/cache'

// Configure timeout limit to match vercel.json
export const maxDuration = 30;

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

interface ProcessingResult {
  name: string;
  householdName: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  noStore()
  
  console.log('Starting text guest import process')
  const startTime = Date.now()
  
  try {
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
    const householdMap = new Map<string, GuestRecord[]>()
    
    // Group guests
    for (const guest of guests) {
      // Basic validation
      if (!guest.name || !guest.household) {
        console.warn('Skipping invalid guest record:', guest)
        continue
      }
      
      if (!householdMap.has(guest.household)) {
        householdMap.set(guest.household, [])
      }
      householdMap.get(guest.household)!.push(guest)
    }
    
    console.log(`Grouped into ${householdMap.size} households`)
    
    // Process in smaller batches
    const results: ProcessingResult[] = []
    const errors: string[] = []
    let processedHouseholds = 0
    let processedGuests = 0
    
    // Process each household and its guests
    for (const [householdName, members] of householdMap.entries()) {
      const batchStartTime = Date.now()
      
      try {
        // Find or create the household - can't use upsert because name isn't unique
        let household = await prisma.household.findFirst({
          where: { 
            name: {
              equals: householdName,
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
        
        // Create the household if it doesn't exist
        if (!household) {
          household = await prisma.household.create({
            data: {
              name: householdName,
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
          })
          console.log(`Created new household: ${householdName}`)
        }
        
        processedHouseholds++
        
        // Get existing guest names for duplicate checking
        const existingGuests = new Set(household.guests.map((g: { name: string }) => g.name.toLowerCase()))
        
        // Process each guest in the household
        for (const member of members) {
          // Skip duplicates
          if (existingGuests.has(member.name.toLowerCase())) {
            results.push({
              name: member.name,
              householdName,
              success: false,
              error: "Duplicate guest"
            })
            continue
          }
          
          try {
            // Create the guest
            await prisma.guest.create({
              data: {
                name: member.name,
                email: member.email || null,
                isChild: member.isChild || false,
                isTeenager: member.isTeenager || false,
                dietaryNotes: member.dietaryNotes || null,
                householdId: household.id
              }
            })
            
            processedGuests++
            
            results.push({
              name: member.name,
              householdName,
              success: true
            })
          } catch (error) {
            console.error(`Error creating guest ${member.name}:`, error)
            
            results.push({
              name: member.name,
              householdName,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error"
            })
          }
        }
        
        console.log(`Processed household "${householdName}" with ${members.length} guests in ${Date.now() - batchStartTime}ms`)
      } catch (error) {
        console.error(`Error processing household ${householdName}:`, error)
        
        if (error instanceof Error) {
          errors.push(`Error processing household ${householdName}: ${error.message}`)
        } else {
          errors.push(`Error processing household ${householdName}: Unknown error`)
        }
        
        // Add failure results for all members of this household
        for (const member of members) {
          results.push({
            name: member.name,
            householdName,
            success: false,
            error: "Household processing failed"
          })
        }
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Import completed in ${totalTime}ms. Created ${processedHouseholds} households and ${processedGuests} guests.`)
    
    // Revalidate the guests page
    revalidatePath('/admin/guests')
    
    // Return a more detailed success response
    return NextResponse.json({ 
      success: true,
      message: `Successfully imported ${processedGuests} guests across ${processedHouseholds} households`,
      processed: {
        households: processedHouseholds,
        guests: processedGuests
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
      processingTime: `${(totalTime/1000).toFixed(2)} seconds`
    })
  } catch (error: any) {
    console.error('Error in import-text-guests route:', error)
    
    return NextResponse.json({ 
      error: 'Failed to process guest data',
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
} 