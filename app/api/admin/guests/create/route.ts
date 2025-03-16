import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  console.log("Starting guest creation...")
  
  try {
    const { name, email, householdName } = await request.json()
    console.log("Received data:", { name, email, householdName })

    // First, check if the database is accessible
    try {
      await prisma.$connect()
      console.log("Database connected successfully")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    // Find or create household
    let household
    try {
      household = await prisma.household.findFirst({
        where: { name: householdName }
      })
      console.log("Found existing household:", household)

      if (!household) {
        household = await prisma.household.create({
          data: {
            name: householdName,
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          }
        })
        console.log("Created new household:", household)
      }
    } catch (householdError) {
      console.error("Household operation error:", householdError)
      return NextResponse.json(
        { error: "Failed to process household" },
        { status: 500 }
      )
    }

    // Create guest
    try {
      const guest = await prisma.guest.create({
        data: {
          name,
          email,
          householdId: household.id,
          isAttending: null,
        },
        include: {
          household: true,
        }
      })
      console.log("Created guest:", guest)

      // Log guest creation activity
      await prisma.guestActivity.create({
        data: {
          guestId: guest.id,
          action: 'GUEST_CREATED',
          details: `Added to household: ${household.name}`
        }
      })

      return NextResponse.json(guest)
    } catch (guestError) {
      console.error("Guest creation error:", guestError)
      return NextResponse.json(
        { error: "Failed to create guest" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Top level error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 