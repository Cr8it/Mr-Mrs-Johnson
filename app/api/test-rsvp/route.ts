import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get all households with their guests
    const households = await prisma.household.findMany({
      include: {
        guests: true
      }
    })

    // Create a test household if none exist
    if (households.length === 0) {
      const testHousehold = await prisma.household.create({
        data: {
          name: "Test Family",
          code: "TEST123",
          guests: {
            create: [
              {
                name: "John Test",
                email: "john@test.com"
              }
            ]
          }
        },
        include: {
          guests: true
        }
      })
      
      households.push(testHousehold)
    }

    return NextResponse.json({
      message: "Database test results",
      households: households.map(h => ({
        name: h.name,
        code: h.code,
        guestCount: h.guests.length,
        guests: h.guests.map(g => g.name)
      }))
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { error: "Database test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 