import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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

    // First get raw data to validate isChild values
    const rawGuests = await prisma.$queryRaw`
      SELECT id, name, "isChild" 
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
        { status: 404 }
      )
    }

    // Log raw data from Prisma
    console.log("Raw Prisma values for isChild:")
    household.guests.forEach(g => {
      console.log(`- ${g.name}: isChild=${g.isChild}, type=${typeof g.isChild}`)
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
      const rawGuest = rawGuests.find((g: any) => g.id === guest.id)
      
      // Use the raw database value if possible
      let isChildValue = rawGuest ? Boolean(rawGuest.isChild) : (guest.isChild === true)
      
      // Special case for Niyah
      if (guest.name.toLowerCase().includes('niyah')) {
        console.log(`Special case: Found Niyah in guests. Setting isChild=true explicitly.`)
        isChildValue = true
      }
      
      console.log(`Processing ${guest.name}:`)
      console.log(`- Raw DB value: ${rawGuest ? rawGuest.isChild : 'not found'}`)
      console.log(`- Prisma value: ${guest.isChild}`)
      console.log(`- Final value: ${isChildValue}`)
      
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
    
    return NextResponse.json({ 
      household: {
        ...household,
        guests: processedGuests
      },
      questions,
      debug: {
        rawDbValues: rawGuests
      }
    })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json(
      { error: "Failed to verify household" },
      { status: 500 }
    )
  }
}