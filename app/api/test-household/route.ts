import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

function generateUniqueCode() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 5)
  return `TEST${timestamp}${random}`.toUpperCase()
}

export async function GET() {
  try {
    // Generate a unique code
    let code = generateUniqueCode()
    let attempts = 0
    const maxAttempts = 3

    // Keep trying until we get a unique code or reach max attempts
    while (attempts < maxAttempts) {
      try {
        // Create a test household with the unique code
        const household = await prisma.household.create({
          data: {
            name: "Test Family",
            code,
            guests: {
              create: [
                { 
                  name: "John Test", 
                  email: "john@test.com",
                  isAttending: null
                },
                { 
                  name: "Jane Test", 
                  email: "jane@test.com",
                  isAttending: null
                }
              ]
            }
          },
          include: {
            guests: true
          }
        })

        // Create activity logs for the new guests
        await Promise.all(household.guests.map(guest => 
          prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'GUEST_CREATED',
              details: `Added to test household: ${household.name}`
            }
          })
        ))

        return NextResponse.json({
          success: true,
          message: "Test household created successfully",
          household: {
            name: household.name,
            code: household.code,
            guests: household.guests.map(g => g.name)
          }
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002 is the error code for unique constraint violations
          if (error.code === 'P2002') {
            attempts++
            code = generateUniqueCode()
            continue
          }
        }
        throw error
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate unique household code after multiple attempts"
      },
      { status: 500 }
    )
  } catch (error) {
    console.error("Error creating test household:", error)
    
    let errorMessage = "Failed to create test household"
    let statusCode = 500

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          errorMessage = "A household with this code already exists"
          statusCode = 409
          break
        case 'P2003':
          errorMessage = "Failed to create related records"
          break
        default:
          errorMessage = `Database error: ${error.code}`
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : undefined
      },
      { status: statusCode }
    )
  }
} 