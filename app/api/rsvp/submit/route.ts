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
}

export async function POST(request: Request) {
  try {
    const { guests } = await request.json()
    console.log("Submitting RSVP for guests:", guests)

    // Update each guest's RSVP details
    const updates = guests.map(async (guest: GuestSubmission) => {
      try {
        // Get the guest's current state to compare changes
        const currentGuest = await prisma.guest.findUnique({
          where: { id: guest.id },
          include: {
            mealChoice: true,
            dessertChoice: true
          }
        })

        // Update guest basic info
        const updatedGuest = await prisma.guest.update({
          where: { id: guest.id },
          data: {
            isAttending: guest.isAttending,
            mealOptionId: guest.mealChoice?.id || null,
            dessertOptionId: guest.dessertChoice?.id || null,
            dietaryNotes: guest.dietaryNotes,
          },
          include: {
            household: true,
            mealChoice: true,
            dessertChoice: true
          }
        })

        // Try to log activities
        try {
          // Log RSVP status change
          if (currentGuest?.isAttending !== guest.isAttending) {
            await prisma.guestActivity.create({
              data: {
                guestId: guest.id,
                action: guest.isAttending ? 'RSVP_YES' : 'RSVP_NO',
                details: guest.isAttending ? 'Confirmed attendance' : 'Declined attendance'
              }
            })
          }

          // Log meal choice change
          if (currentGuest?.mealChoice?.id !== guest.mealChoice?.id && guest.mealChoice) {
            await prisma.guestActivity.create({
              data: {
                guestId: guest.id,
                action: 'UPDATE_MEAL',
                details: `Selected meal: ${guest.mealChoice.name}`
              }
            })
          }

          // Log dessert choice change
          if (currentGuest?.dessertChoice?.id !== guest.dessertChoice?.id && guest.dessertChoice) {
            await prisma.guestActivity.create({
              data: {
                guestId: guest.id,
                action: 'UPDATE_DESSERT',
                details: `Selected dessert: ${guest.dessertChoice.name}`
              }
            })
          }
        } catch (activityError) {
          console.error("Failed to log activities:", activityError)
          // Continue with the update even if activity logging fails
        }

        // Handle responses
        if (guest.responses && guest.responses.length > 0) {
          await prisma.questionResponse.deleteMany({
            where: { guestId: guest.id }
          })

          await prisma.questionResponse.createMany({
            data: guest.responses.map(response => ({
              guestId: guest.id,
              questionId: response.questionId,
              answer: response.answer
            }))
          })
        }

        return updatedGuest
      } catch (guestError) {
        console.error(`Error updating guest ${guest.id}:`, guestError)
        throw guestError
      }
    })

    const updatedGuests = await Promise.all(updates)
    console.log("Updated guests:", updatedGuests)

    // Send confirmation email
    try {
      await sendRsvpConfirmation(updatedGuests.map(guest => ({
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
      message: "RSVP submitted successfully"
    })
  } catch (error) {
    console.error("RSVP submit error:", error)
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    )
  }
}
