import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { guestId, isChild, guestName } = await request.json()
    
    if (!guestId) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }
    
    console.log(`Attempting to fix child status for ${guestName || guestId}: Setting isChild=${isChild}`)
    
    // Get current guest state for logging
    const currentGuest = await prisma.guest.findUnique({
      where: { id: guestId }
    })
    
    if (!currentGuest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }
    
    console.log(`Current database value for ${currentGuest.name}: isChild=${currentGuest.isChild} (${typeof currentGuest.isChild})`)
    
    // Directly update the isChild field in the database
    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { 
        isChild: isChild === true
      }
    })
    
    console.log(`Updated ${updatedGuest.name}: isChild=${updatedGuest.isChild} (${typeof updatedGuest.isChild})`)
    
    // Log the change in guest activity
    await prisma.guestActivity.create({
      data: {
        guestId: guestId,
        action: 'FIX_CHILD_STATUS',
        details: `Fixed child status from ${currentGuest.isChild} to ${updatedGuest.isChild} via emergency fix route`
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Updated child status for ${updatedGuest.name}`,
      previousValue: currentGuest.isChild,
      newValue: updatedGuest.isChild
    })
  } catch (error) {
    console.error("Error fixing child status:", error)
    return NextResponse.json({ 
      error: "Failed to fix child status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 