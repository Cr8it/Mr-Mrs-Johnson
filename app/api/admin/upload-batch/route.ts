import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Add exports to match vercel.json configuration
export const maxDuration = 30;

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Type definition for better type safety
interface GuestRecord {
  Name: string;
  Household: string;
  Email?: string;
  Child?: string;
  Teenager?: string;
  DietaryNotes?: string;
}

export async function POST(request: Request) {
  console.log("Batch upload route called")
  const startTime = Date.now()
  
  try {
    // Parse the form data
    const formData = await request.formData()
    const dataBlob = formData.get('data') as Blob
    
    if (!dataBlob) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 })
    }
    
    // Read and parse JSON data
    const jsonText = await dataBlob.text()
    const { records } = JSON.parse(jsonText)
    
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No valid records in batch" }, { status: 400 })
    }
    
    console.log(`Processing batch of ${records.length} records`)
    
    // Group by household for more efficient processing
    const households = new Map<string, GuestRecord[]>()
    
    // First pass: group records by household
    for (const record of records) {
      if (!record.Name?.trim() || !record.Household?.trim()) {
        continue // Skip invalid records
      }
      
      const householdName = record.Household.trim()
      
      if (!households.has(householdName)) {
        households.set(householdName, [])
      }
      
      households.get(householdName)!.push(record)
    }
    
    console.log(`Grouped into ${households.size} households`)
    
    // Process in smaller batches
    const results: any[] = []
    const errors: string[] = []
    let processedHouseholds = 0
    let processedGuests = 0
    
    // Process households in batches
    for (const [householdName, members] of households.entries()) {
      const batchStartTime = Date.now()
      
      try {
        // Find or create the household
        const household = await prisma.household.upsert({
          where: { name: householdName },
          update: {}, // No updates needed if it exists
          create: {
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
        
        processedHouseholds++
        
        // Get existing guests to avoid duplicates
        const existingGuests = new Set(household.guests.map(g => g.name.toLowerCase()))
        
        // Process each guest in the household
        for (const member of members) {
          const guestName = member.Name.trim()
          
          // Skip duplicates
          if (existingGuests.has(guestName.toLowerCase())) {
            results.push({
              name: guestName,
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
                name: guestName,
                email: member.Email ? member.Email.trim() : null,
                isChild: member.Child === 'C' || member.Child === 'true' || member.Child === 'YES',
                isTeenager: member.Teenager === 'T' || member.Teenager === 'true' || member.Teenager === 'YES',
                dietaryNotes: member.DietaryNotes || null,
                householdId: household.id
              }
            })
            
            processedGuests++
            
            results.push({
              name: guestName,
              householdName,
              success: true
            })
          } catch (error) {
            console.error(`Error creating guest ${guestName}:`, error)
            
            results.push({
              name: guestName,
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
        
        // Add failure results for all members
        for (const member of members) {
          results.push({
            name: member.Name.trim(),
            householdName,
            success: false,
            error: "Household processing failed"
          })
        }
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Batch upload completed in ${totalTime}ms. Created ${processedHouseholds} households and ${processedGuests} guests.`)
    
    // Return results
    return NextResponse.json({
      success: true,
      processed: {
        households: processedHouseholds,
        guests: processedGuests
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
      processingTime: `${(totalTime/1000).toFixed(2)} seconds`
    })
  } catch (error: any) {
    console.error('Batch upload error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process batch', 
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 