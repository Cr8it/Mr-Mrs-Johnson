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
      try {
        // First, get the current guest data
        const currentGuest = await prisma.guest.findUnique({
          where: { id: guest.id },
          select: { isChild: true }
        });

        if (!currentGuest) {
          console.error(`Guest not found: ${guest.id}`);
          continue;
        }

        // Force boolean conversion of isChild
        const isChildValue = currentGuest.isChild === true;
        
        // Update the guest with forced boolean value
        const updatedGuest = await prisma.guest.update({
          where: { id: guest.id },
          data: {
            isAttending: guest.isAttending,
            mealOptionId: guest.isAttending ? guest.mealChoice?.id : null,
            dessertOptionId: guest.isAttending ? guest.dessertChoice?.id : null,
            dietaryNotes: guest.dietaryNotes,
            isChild: isChildValue
          },
          include: {
            mealChoice: true,
            dessertChoice: true
          }
        });
        
        console.log(`Updated guest ${updatedGuest.name}:`, {
          id: updatedGuest.id,
          isChild: updatedGuest.isChild,
          typeOfIsChild: typeof updatedGuest.isChild
        });
        
        results.push(updatedGuest);
      } catch (error) {
        console.error(`Error processing guest ${guest.id}:`, error);
      }
    }
    
    // Send confirmation email if we have results
    if (results.length > 0) {
      try {
        await sendRsvpConfirmation(results.map(guest => ({
          id: guest.id,
          name: guest.name,
          isAttending: guest.isAttending,
          mealChoice: guest.mealChoice,
          dessertChoice: guest.dessertChoice,
          dietaryNotes: guest.dietaryNotes,
          email: guest.email
        })));
      } catch (emailError) {
        console.error("Failed to send RSVP confirmation email:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      results: results
    });
  } catch (error) {
    console.error("Error processing RSVP submission:", error);
    return NextResponse.json({ 
      error: "Failed to process RSVP submission",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
