import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { guestId, isChild, guestName } = await request.json()
    
    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID is required" },
        { status: 400 }
      )
    }
    
    console.log(`Fixing child status for ${guestName || guestId}: Setting isChild=${isChild}`)
    
    // Get current state for logging
    const currentGuest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        name: true,
        isChild: true,
        household: { select: { name: true, code: true } }
      }
    })
    
    if (!currentGuest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      )
    }
    
    console.log(`Current state for ${currentGuest.name}:`)
    console.log(`- isChild: ${currentGuest.isChild}, type: ${typeof currentGuest.isChild}`)
    
    // First try to do a direct raw query to ensure database is updated
    await prisma.$executeRaw`
      UPDATE "Guest" 
      SET "isChild" = ${isChild === true}
      WHERE id = ${guestId}
    `
    
    // Then do the normal Prisma update to stay consistent
    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { 
        isChild: isChild === true
      },
      select: {
        id: true, 
        name: true,
        isChild: true,
        household: { select: { name: true, code: true } }
      }
    })
    
    console.log(`Updated state for ${updatedGuest.name}:`)
    console.log(`- isChild: ${updatedGuest.isChild}, type: ${typeof updatedGuest.isChild}`)
    
    // Do a direct check to verify the change
    const verification = await prisma.$queryRaw`
      SELECT "isChild" FROM "Guest" WHERE id = ${guestId}
    `
    console.log("Direct database verification:", verification)
    
    return NextResponse.json({
      success: true,
      message: `Updated child status for ${updatedGuest.name}`,
      before: {
        isChild: currentGuest.isChild,
        type: typeof currentGuest.isChild
      },
      after: {
        isChild: updatedGuest.isChild,
        type: typeof updatedGuest.isChild
      },
      verification,
      guest: {
        id: updatedGuest.id,
        name: updatedGuest.name,
        householdName: updatedGuest.household.name,
        householdCode: updatedGuest.household.code
      }
    })
  } catch (error) {
    console.error("Error fixing child status:", error)
    return NextResponse.json(
      { error: "Failed to fix child status" },
      { status: 500 }
    )
  }
} 