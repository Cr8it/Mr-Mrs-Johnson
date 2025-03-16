import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    const guestCount = await prisma.guest.count()
    const householdCount = await prisma.household.count()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      counts: {
        guests: guestCount,
        households: householdCount
      }
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { 
        error: "Database connection failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
} 