import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { guestId, isAttending, mealOptionId, dessertOptionId } = await request.json()
    
    if (!guestId) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }
    
    const guest = await prisma.guest.findUnique({
      where: { id: guestId }
    })
    
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }
    
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