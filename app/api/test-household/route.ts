import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Create a test household
    const household = await prisma.household.create({
      data: {
        name: "Test Family",
        code: "TEST123",
        guests: {
          create: [
            { name: "John Test", email: "john@test.com" },
            { name: "Jane Test", email: "jane@test.com" }
          ]
        }
      },
      include: {
        guests: true
      }
    })

    return NextResponse.json({
      message: "Test household created",
      household: {
        name: household.name,
        code: household.code,
        guests: household.guests.map(g => g.name)
      }
    })
  } catch (error) {
    console.error("Error creating test household:", error)
    return NextResponse.json(
      { error: "Failed to create test household" },
      { status: 500 }
    )
  }
} 