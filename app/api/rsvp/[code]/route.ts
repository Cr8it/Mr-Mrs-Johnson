import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // First let's get the raw database values for debugging
    const rawGuests = await prisma.guest.findMany({
      where: {
        household: {
          code: params.code
        }
      },
      select: {
        id: true,
        name: true,
        isChild: true
      }
    });
    
    console.log("RAW DATABASE VALUES:");
    rawGuests.forEach(g => {
      console.log(`DB RAW: Guest ${g.name} (${g.id}): isChild raw value = ${g.isChild}, type = ${typeof g.isChild}`);
    });

    // Now get full household data
    const household = await prisma.household.findFirst({
      where: {
        code: params.code,
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
        },
      },
    })

    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    // Debug specific guest for Niyah Dublin
    const niyahGuest = household.guests.find(g => g.name.toLowerCase().includes('niyah'));
    if (niyahGuest) {
      console.log("========================== NIYAH DEBUG ==========================");
      console.log(`FOUND NIYAH: Name=${niyahGuest.name}, ID=${niyahGuest.id}`);
      console.log(`Raw isChild value in database: ${niyahGuest.isChild} (${typeof niyahGuest.isChild})`);
      console.log(`isChild === true: ${niyahGuest.isChild === true}`);
      console.log(`Boolean(isChild): ${Boolean(niyahGuest.isChild)}`);
      console.log("=================================================================");
    }

    // Transform the data to include existing choices - paying special attention to isChild
    const transformedHousehold = {
      ...household,
      guests: household.guests.map(guest => {
        // IMPORTANT: Force isChild to be a proper boolean by directly reading from database
        const rawDbValue = rawGuests.find(g => g.id === guest.id)?.isChild;
        
        // Use triple equals to ensure we get a true boolean (avoid truthy/falsy issues)
        const isChildValue = rawDbValue === true;
        
        console.log(`Processing guest ${guest.name}:`);
        console.log(`- Database isChild value: ${rawDbValue} (type: ${typeof rawDbValue})`);
        console.log(`- Using triple equals check: isChildValue = ${isChildValue} (${typeof isChildValue})`);
        
        // Log a very clear message if this is a child guest
        if (isChildValue) {
          console.log(`⭐ IMPORTANT: ${guest.name} IS A CHILD - should see child meal options`);
        }
        
        return {
          ...guest,
          mealChoice: guest.mealChoice?.id || null,
          dessertChoice: guest.dessertChoice?.id || null,
          // Use strict equality check for boolean conversion
          isChild: isChildValue,
          responses: guest.responses.map(response => ({
            questionId: response.questionId,
            answer: response.answer
          }))
        };
      })
    }

    // Transform questions to parse options for multiple choice questions
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

    // Log the final guest data being sent to client for debugging
    console.log("FINAL DATA BEING SENT TO CLIENT:");
    transformedHousehold.guests.forEach(guest => {
      console.log(`FINAL: Guest ${guest.name}: isChild=${guest.isChild}, type=${typeof guest.isChild}, isChild===true: ${guest.isChild === true}`);
    });

    return NextResponse.json({ 
      household: transformedHousehold, 
      questions: transformedQuestions 
    })
  } catch (error) {
    console.error("Error fetching RSVP data:", error)
    return NextResponse.json({ error: "Failed to load RSVP data" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    console.log(`Processing RSVP submission for household code: ${params.code}`)
    const { responses } = await request.json()
    const household = await prisma.household.findFirst({
      where: {
        code: params.code,
      },
      include: {
        guests: {
          include: {
            mealChoice: true,
            dessertChoice: true
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
      const isAttending = responses[`attending-${guest.id}`]
      const mealOptionId = responses[`meal-${guest.id}`]
      const dessertOptionId = responses[`dessert-${guest.id}`]
      
      console.log(`Guest ${guest.name}: Attending=${isAttending}, Meal=${mealOptionId}, Dessert=${dessertOptionId}, isChild=${guest.isChild === true}`);

      // Track changes for logging
      const mealChanged = guest.mealOptionId !== mealOptionId
      const dessertChanged = guest.dessertOptionId !== dessertOptionId
      
      // Update the guest record, explicitly preserving the isChild status
      await prisma.guest.update({
        where: {
          id: guest.id,
        },
        data: {
          isAttending,
          mealOptionId: isAttending ? mealOptionId : null,
          dessertOptionId: isAttending ? dessertOptionId : null,
          // We're not modifying isChild - it stays as set in the database
        },
      })

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
    }

    // Save household-level responses
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


