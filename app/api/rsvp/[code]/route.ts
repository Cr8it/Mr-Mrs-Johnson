import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Find the household
    const household = await prisma.household.findFirst({
      where: {
        code: {
          equals: params.code,
          mode: 'insensitive'
        }
      },
      include: {
        guests: {
          include: {
            mealChoice: true,
            dessertChoice: true,
            responses: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      )
    }

    // Get active questions
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })

    // Transform questions to parse options
    const transformedQuestions = questions.map(question => ({
      ...question,
      options: question.type === "MULTIPLE_CHOICE" ? 
        (() => {
          try {
            return JSON.parse(question.options)
          } catch {
            return []
          }
        })() : 
        []
    }))

    // Process guests to ensure proper typing
    const processedGuests = household.guests.map(guest => {
      // Force isChild to be a proper boolean
      const isChildValue = guest.isChild === true;
      
      console.log(`Processing guest ${guest.name}:`, {
        id: guest.id,
        originalIsChild: guest.isChild,
        originalType: typeof guest.isChild,
        processedIsChild: isChildValue,
        processedType: typeof isChildValue
      });
      
      return {
        ...guest,
        isChild: isChildValue,
        // Also convert other nullable fields to a proper format
        mealChoice: guest.mealChoiceId || guest.mealChoice?.id,
        dessertChoice: guest.dessertChoiceId || guest.dessertChoice?.id,
        isAttending: guest.isAttending
      };
    });

    const responseData = {
      household: {
        ...household,
        guests: processedGuests
      },
      questions: transformedQuestions
    };

    // Return the response with cache control headers to prevent stale data
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching household data:", error)
    return NextResponse.json(
      { error: "Failed to fetch household data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const responses = await request.json()
    
    // Debugging the incoming responses
    console.log(`Received RSVP responses for household code: ${params.code}`, {
      responseKeys: Object.keys(responses),
      sampleValues: Object.entries(responses).slice(0, 5).map(([key, value]) => `${key}: ${value}`)
    })

    // Find the household with all guest data including meal and dessert choices
    const household = await prisma.household.findFirst({
      where: {
        code: {
          equals: params.code,
          mode: 'insensitive'
        },
      },
      include: {
        guests: {
          include: {
            mealChoice: true,
            dessertChoice: true,
          }
        },
      },
    })

    if (!household) {
      console.error(`Household not found for code: ${params.code}`)
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }

    console.log(`Processing RSVP for household: ${household.name} (${household.guests.length} guests)`)
    
    // Process responses for each guest
    for (const guest of household.guests) {
      // Ensure isChild is a boolean
      const isChildValue = guest.isChild === true;
      
      const isAttending = responses[`attending-${guest.id}`]
      const mealOptionId = responses[`meal-${guest.id}`]
      const dessertOptionId = responses[`dessert-${guest.id}`]
      
      console.log(`Guest ${guest.name}: Attending=${isAttending}, Meal=${mealOptionId}, Dessert=${dessertOptionId}, isChild=${isChildValue}`);

      // Track changes for logging
      const mealChanged = guest.mealChoiceId !== mealOptionId
      const dessertChanged = guest.dessertChoiceId !== dessertOptionId
      
      try {
        // Update the guest record, explicitly preserving the isChild status
        await prisma.guest.update({
          where: {
            id: guest.id,
          },
          data: {
            isAttending,
            mealChoiceId: isAttending ? mealOptionId : null,
            dessertChoiceId: isAttending ? dessertOptionId : null,
            // We're not modifying isChild - it stays as set in the database
          },
        })
        
        console.log(`Successfully updated guest: ${guest.name} (ID: ${guest.id}), isAttending: ${isAttending}`);
      } catch (err) {
        console.error(`Error updating guest ${guest.name} (ID: ${guest.id}):`, err);
        continue; // Skip activity logging for failed updates
      }

      // Log guest activities for significant changes
      if (isAttending) {
        // Log attendance status change if it changed
        if (guest.isAttending !== isAttending) {
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'RSVP_YES',
              details: 'Confirmed attendance through RSVP form'
            }
          })
        }
        
        // Log meal choice change
        if (mealChanged && mealOptionId) {
          const mealOption = await prisma.mealOption.findUnique({
            where: { id: mealOptionId }
          })
          
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'UPDATE_MEAL',
              details: `Selected meal option: ${mealOption?.name || mealOptionId}`
            }
          })
          
          console.log(`Updated meal choice for ${guest.name}: ${mealOption?.name || mealOptionId}`)
        }
        
        // Log dessert choice change
        if (dessertChanged && dessertOptionId) {
          const dessertOption = await prisma.dessertOption.findUnique({
            where: { id: dessertOptionId }
          })
          
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'UPDATE_DESSERT',
              details: `Selected dessert option: ${dessertOption?.name || dessertOptionId}`
            }
          })
          
          console.log(`Updated dessert choice for ${guest.name}: ${dessertOption?.name || dessertOptionId}`)
        }
      } else if (guest.isAttending !== isAttending) {
        // Log declined attendance
        await prisma.guestActivity.create({
          data: {
            guestId: guest.id,
            action: 'RSVP_NO',
            details: 'Declined attendance through RSVP form'
          }
        })
      }

      // Save guest-specific responses
      try {
        const guestResponses = Object.entries(responses)
          .filter(([key]) => key.endsWith(`-${guest.id}`))
          .filter(([key]) => !key.startsWith('meal-') && !key.startsWith('dessert-') && !key.startsWith('attending-'))
          .map(([key, value]) => ({
            questionId: key.split("-")[0],
            guestId: guest.id,
            answer: String(value),
          }))

        if (guestResponses.length > 0) {
          // Delete existing responses first
          await prisma.questionResponse.deleteMany({
            where: { guestId: guest.id }
          })

          // Create new responses
          await prisma.questionResponse.createMany({
            data: guestResponses,
          })
          
          console.log(`Saved ${guestResponses.length} question responses for ${guest.name}`)
        }
      } catch (err) {
        console.error(`Error saving responses for guest ${guest.name} (ID: ${guest.id}):`, err);
      }
    }

    // Save household-level responses
    try {
      const householdResponses = Object.entries(responses)
        .filter(([key]) => !key.includes("-"))
        .map(([questionId, value]) => ({
          questionId,
          guestId: household.guests[0].id,
          answer: String(value),
        }))

      if (householdResponses.length > 0) {
        await prisma.questionResponse.createMany({
          data: householdResponses,
        })
        
        console.log(`Saved ${householdResponses.length} household-level responses`)
      }
    } catch (err) {
      console.error("Error saving household responses:", err);
    }

    console.log(`RSVP submission completed successfully for household: ${household.name}`)
    return NextResponse.json({ 
      success: true,
      message: "Thank you for your RSVP!" 
    })
  } catch (error) {
    console.error("Error processing RSVP:", error)
    return NextResponse.json({ error: "Failed to process RSVP" }, { status: 500 })
  }
}


