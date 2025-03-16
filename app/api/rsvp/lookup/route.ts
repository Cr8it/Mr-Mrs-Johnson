import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    console.log("Looking up code:", code)
    
    // Convert code to uppercase and remove spaces
    const normalizedCode = code.toUpperCase().replace(/\s+/g, '')
    console.log("Normalized code:", normalizedCode)

    // First, check if we can find any households at all
    const allHouseholds = await prisma.household.findMany({
      select: { code: true }
    })
    console.log("All available household codes:", allHouseholds.map(h => h.code))

    const household = await prisma.household.findFirst({
      where: {
        code: normalizedCode
      },
      include: {
        guests: {
          include: {
            responses: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    console.log("Found household:", household ? {
      name: household.name,
      code: household.code,
      guestCount: household.guests.length
    } : null)

    if (!household) {
      return NextResponse.json(
        { error: "Household not found. Please check your code and try again." },
        { status: 404 }
      )
    }

    return NextResponse.json(household)
  } catch (error) {
    console.error("RSVP lookup error:", error)
    return NextResponse.json(
      { error: "Failed to look up RSVP code" },
      { status: 500 }
    )
  }
} 