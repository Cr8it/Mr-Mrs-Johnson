import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendRsvpConfirmation } from "@/lib/email"

interface GuestSubmission {
  id: string
  isAttending: boolean | null
  mealChoice: {
    id: string
    name: string
  } | null
  dessertChoice: {
    id: string
    name: string
  } | null
  dietaryNotes: string | null
  responses?: Array<{
    questionId: string
    answer: string
  }>
  isChild?: boolean
}

export async function POST(request: Request) {
  try {
    const { guests } = await request.json()
    console.log("Received RSVP submission:", JSON.stringify(guests, null, 2))
    
    if (!guests || !Array.isArray(guests)) {
      return NextResponse.json({ error: "Invalid guest data" }, { status: 400 })
    }
    
    const results = [];
    
    // Process each guest
    for (const guest of guests) {
      // Log the raw isChild value to debug
      console.log(`Processing guest ${guest.name}:`, {
        id: guest.id,
        isChild: guest.isChild,
        typeOfIsChild: typeof guest.isChild
      });
      
      // Safely normalize isChild to a boolean value
      const normalizedIsChild = (() => {
        if (typeof guest.isChild === 'string') {
          return guest.isChild === 'true' || guest.isChild === 'TRUE';
        }
        return Boolean(guest.isChild);
      })();
      
      // Update the guest with normalized isChild value
      const updatedGuest = await prisma.guest.update({
        where: {
          id: guest.id,
        },
        data: {
          isAttending: guest.isAttending,
          mealOptionId: guest.isAttending ? guest.mealChoice?.id : null,
          dessertOptionId: guest.isAttending ? guest.dessertChoice?.id : null,
          dietaryNotes: guest.dietaryNotes,
          // Now explicitly update isChild with a properly normalized boolean value
          isChild: normalizedIsChild,
        },
        // Include relations to get full objects for the email
        include: {
          mealChoice: true,
          dessertChoice: true
        }
      });
      
      // Log what's being saved
      console.log(`Updated guest ${updatedGuest.name} (isChild=${updatedGuest.isChild}):`, {
        isAttending: updatedGuest.isAttending,
        mealOptionId: updatedGuest.mealOptionId,
        dessertOptionId: updatedGuest.dessertOptionId
      });
      
      results.push(updatedGuest);
    }
    
    // Send confirmation email
    try {
      await sendRsvpConfirmation(results.map(guest => ({
        id: guest.id,
        name: guest.name,
        isAttending: guest.isAttending,
        mealChoice: guest.mealChoice,
        dessertChoice: guest.dessertChoice,
        dietaryNotes: guest.dietaryNotes,
        email: guest.email
      })))
    } catch (emailError) {
      console.error("Failed to send RSVP confirmation email:", emailError)
    }

    return NextResponse.json({ 
      success: true, 
      results: results
    })
  } catch (error) {
    console.error("Error processing RSVP submission:", error)
    return NextResponse.json({ 
      error: "Failed to process RSVP submission" 
    }, { status: 500 })
  }
}
