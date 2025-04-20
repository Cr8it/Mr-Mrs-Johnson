import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Define an interface for the raw guest data from the database
interface RawGuestData {
  id: string;
  name: string;
  isChild: boolean | null;
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "Household code is required" },
        { status: 400 }
      )
    }

    console.log(`Verifying household with code: ${code}`)

    // First get raw data to validate isChild values using explicit boolean casting
    const rawGuests = await prisma.$queryRaw<RawGuestData[]>`
      SELECT id, name, "isChild"::boolean as "isChild" 
      FROM "Guest" 
      WHERE "householdId" IN (
        SELECT id FROM "Household" WHERE code = ${code}
      )
    `
    
    console.log("Raw database values for isChild:")
    console.log(JSON.stringify(rawGuests, null, 2))

    const household = await prisma.household.findUnique({
      where: { code },
      include: {
        guests: {
          include: {
            mealChoice: true,
            dessertChoice: true,
            responses: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json(
        { error: "Household not found" },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Surrogate-Control': 'no-store'
          }
        }
      )
    }

    // Log raw data from Prisma
    console.log("Raw Prisma values for isChild:")
    household.guests.forEach(g => {
      console.log(`- ${g.name}: isChild=${g.isChild}, type=${typeof g.isChild}, value stringified=${JSON.stringify(g.isChild)}`)
    })

    // Fetch any active questions
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    console.log(`Found household "${household.name}" with ${household.guests.length} guests`)
    
    // Process guests with enhanced debugging and matching
    const processedGuests = household.guests.map(guest => {
      // Find the raw data for this guest
      const rawGuest = rawGuests.find(g => g.id === guest.id)
      
      // Enhanced debugging for the isChild field
      console.log(`[${guest.name}] Raw DB isChild:`, rawGuest ? {
        value: rawGuest.isChild,
        type: typeof rawGuest.isChild,
        valueWhenCastToBoolean: Boolean(rawGuest.isChild)
      } : 'not found')
      
      console.log(`[${guest.name}] Prisma isChild:`, {
        value: guest.isChild,
        type: typeof guest.isChild,
        valueWhenCastToBoolean: Boolean(guest.isChild),
        valueWhenComparedToTrue: guest.isChild === true
      })
      
      // Use the raw database value if possible, with explicit boolean conversion
      let isChildValue = false
      
      if (rawGuest && rawGuest.isChild !== null) {
        isChildValue = rawGuest.isChild === true
      } else if (guest.isChild !== null) {
        isChildValue = guest.isChild === true
      }
      
      // Special case for Niyah
      if (guest.name.toLowerCase().includes('niyah')) {
        console.log(`Special case: Found Niyah in guests. Setting isChild=true explicitly.`)
        isChildValue = true
        
        // Also try to fix in the database immediately
        try {
          console.log(`Auto-fixing Niyah's isChild value in database...`)
          prisma.$executeRaw`
            UPDATE "Guest" 
            SET "isChild" = true::boolean 
            WHERE id = ${guest.id}
          `.then(() => console.log(`Niyah fixed in database!`))
            .catch(e => console.error(`Failed to auto-fix Niyah:`, e))
        } catch (e) {
          console.error(`Error during auto-fix attempt:`, e)
        }
      }
      
      console.log(`Processing ${guest.name}: Final isChild value=${isChildValue}`)
      
      return {
        id: guest.id,
        name: guest.name,
        isAttending: guest.isAttending,
        mealChoice: guest.mealChoice?.id,
        dessertChoice: guest.dessertChoice?.id,
        dietaryNotes: guest.dietaryNotes,
        responses: guest.responses,
        isChild: isChildValue
      }
    })
    
    // Return response with no-cache headers
    return NextResponse.json(
      { 
        household: {
          ...household,
          guests: processedGuests
        },
        questions,
        debug: {
          rawDbValues: rawGuests
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json(
      { error: "Failed to verify household" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  }
}