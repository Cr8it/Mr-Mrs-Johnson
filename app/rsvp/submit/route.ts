import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { guestId, isAttending, mealOptionId, dessertOptionId } = await request.json()
    console.log("RSVP submission - received data:", { guestId, isAttending, mealOptionId, dessertOptionId })
    
    if (!guestId) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }
    
    const guest = await prisma.guest.findUnique({
      where: { id: guestId }
    })
    
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }
    
    // Log the current value of isChild in the database
    console.log(`Guest ${guest.name} current DB values:`, {
      isChild: guest.isChild,
      typeOfIsChild: typeof guest.isChild,
      rawValue: guest.isChild
    })
    
    // Update guest while preserving the isChild status
    const updatedGuest = await prisma.guest.update({
      where: {
        id: guestId,
      },
      data: {
        isAttending,
        mealOptionId: isAttending ? mealOptionId : null,
        dessertOptionId: isAttending ? dessertOptionId : null,
        // Note: We don't update isChild - it remains as set in the database
      },
    })
    
    // Verify isChild was preserved
    console.log(`Guest ${updatedGuest.name} after update:`, {
      isChild: updatedGuest.isChild,
      isAttending: updatedGuest.isAttending,
      mealOptionId: updatedGuest.mealOptionId,
      dessertOptionId: updatedGuest.dessertOptionId
    })
    
    return NextResponse.json({ 
      success: true, 
      guest: updatedGuest 
    })
  } catch (error) {
    console.error("Error processing RSVP submission:", error)
    return NextResponse.json({ 
      error: "Failed to process RSVP submission" 
    }, { status: 500 })
  }
} 