import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { guestId, value } = await request.json()

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID is required" },
        { status: 400 }
      )
    }

    console.log(`Fixing child status for guest ${guestId}: Setting isChild=${value === true}`)

    // Get current state for comparison
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: { 
        id: true, 
        name: true, 
        isChild: true,
        household: {
          select: { name: true, code: true }
        }
      }
    })

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      )
    }
    
    // First, direct raw SQL update with explicit casting to ensure database gets proper boolean
    await prisma.$executeRaw`
      UPDATE "Guest" 
      SET "isChild" = ${value === true}::boolean
      WHERE id = ${guestId}
    `
    
    // Then, use Prisma to update for consistent state
    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { isChild: value === true },
      select: { 
        id: true, 
        name: true, 
        isChild: true,
        household: {
          select: { name: true, code: true }
        }
      }
    })

    // Finally, double-check the actual value in the database
    const verificationResult = await prisma.$queryRaw<{ isChild: boolean }[]>`
      SELECT "isChild"::boolean as "isChild" 
      FROM "Guest" 
      WHERE id = ${guestId}
    `
    
    console.log(`Child status fixed: ${guest.name}'s isChild was ${guest.isChild}, is now ${updatedGuest.isChild}`)
    console.log(`Verification result:`, verificationResult)

    return NextResponse.json(
      {
        success: true,
        message: `Updated child status for ${guest.name}`,
        guest: {
          id: updatedGuest.id,
          name: updatedGuest.name,
          isChild: updatedGuest.isChild,
          householdName: updatedGuest.household.name,
          householdCode: updatedGuest.household.code
        },
        before: {
          isChild: guest.isChild,
          type: typeof guest.isChild
        },
        after: {
          isChild: updatedGuest.isChild, 
          type: typeof updatedGuest.isChild
        },
        verification: verificationResult[0]
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error("Fix child status error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fix child status",
        details: error instanceof Error ? error.message : String(error)
      },
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