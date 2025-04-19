import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { guestId, isAttending, mealOptionId, dessertOptionId } = await request.json()
    
    if (!guestId) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }
    
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        mealChoice: true,
        dessertChoice: true
      }
    })
    
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }
    
    console.log(`Processing RSVP for guest ${guest.name} (ID: ${guestId}):`, {
      isAttending,
      mealOptionId: isAttending ? mealOptionId : null,
      dessertOptionId: isAttending ? dessertOptionId : null
    })
    
    // Track changes for activity logging
    const mealChanged = guest.mealOptionId !== mealOptionId
    const dessertChanged = guest.dessertOptionId !== dessertOptionId
    
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
      include: {
        mealChoice: true,
        dessertChoice: true
      }
    })
    
    // Log guest activities for significant changes
    if (isAttending) {
      // Log attendance status change if it changed
      if (guest.isAttending !== isAttending) {
        await prisma.guestActivity.create({
          data: {
            guestId: guestId,
            action: 'RSVP_YES',
            details: 'Confirmed attendance through RSVP form'
          }
        })
      }
      
      // Log meal choice change
      if (mealChanged && mealOptionId) {
        await prisma.guestActivity.create({
          data: {
            guestId: guestId,
            action: 'UPDATE_MEAL',
            details: `Selected meal option: ${updatedGuest.mealChoice?.name || mealOptionId}`
          }
        })
      }
      
      // Log dessert choice change
      if (dessertChanged && dessertOptionId) {
        await prisma.guestActivity.create({
          data: {
            guestId: guestId,
            action: 'UPDATE_DESSERT',
            details: `Selected dessert option: ${updatedGuest.dessertChoice?.name || dessertOptionId}`
          }
        })
      }
    } else if (guest.isAttending !== isAttending) {
      // Log declined attendance
      await prisma.guestActivity.create({
        data: {
          guestId: guestId,
          action: 'RSVP_NO',
          details: 'Declined attendance through RSVP form'
        }
      })
    }
    
    // Force-refresh the statistics to ensure they're up to date
    try {
      // Intentionally not awaiting this to speed up response time
      // We just want to trigger a statistics refresh in the background
      prisma.mealOption.findMany({
        select: {
          _count: {
            select: { guests: { where: { isAttending: true } } }
          }
        }
      })
      prisma.dessertOption.findMany({
        select: {
          _count: {
            select: { guests: { where: { isAttending: true } } }
          }
        }
      })
    } catch (refreshError) {
      console.error("Failed to refresh statistics:", refreshError)
    }
    
    console.log(`RSVP update completed for guest ${updatedGuest.name}:`, {
      isAttending: updatedGuest.isAttending, 
      mealChoice: updatedGuest.mealChoice?.name || 'None',
      dessertChoice: updatedGuest.dessertChoice?.name || 'None'
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