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

    // Fetch any active questions
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    console.log(`Found household "${household.name}" with ${household.guests.length} guests`)
    
    return NextResponse.json({ 
      household: {
        ...household,
        // Format guest data to match expected structure
        guests: household.guests.map(guest => ({
          id: guest.id,
          name: guest.name,
          isAttending: guest.isAttending,
          mealChoice: guest.mealChoice?.id,
          dessertChoice: guest.dessertChoice?.id,
          dietaryNotes: guest.dietaryNotes,
          responses: guest.responses,
          isChild: guest.isChild === true
        }))
      },
      questions
    })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json(
      { error: "Failed to verify household" },
      { status: 500 }
    )
  }
}