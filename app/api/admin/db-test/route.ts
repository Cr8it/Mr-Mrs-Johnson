import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Test creating a household
    const household = await prisma.household.create({
      data: {
        name: "Test Household",
        code: "TEST123",
      }
    })

    return NextResponse.json({
      success: true,
      message: "Database is working",
      testHousehold: household
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 