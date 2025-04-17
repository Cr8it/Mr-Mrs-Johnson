import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    console.log(`Fetching RSVP data for code: ${params.code}`);
    
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

    // Log raw guest data from the database
    console.log('Raw guest data from database:', household.guests.map(g => ({
      name: g.name, 
      isChild: g.isChild,
      typeOfIsChild: typeof g.isChild
    })));

    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    // Transform the data to include existing choices
    const transformedHousehold = {
      ...household,
      guests: household.guests.map(guest => {
        // Force isChild to be a proper boolean value - handle it based on its actual type
        const isChildValue = typeof guest.isChild === 'string' 
          ? guest.isChild.toLowerCase() === 'true'
          : Boolean(guest.isChild);
          
        console.log(`Transforming guest ${guest.name}: raw isChild=${guest.isChild} → transformed=${isChildValue}`);
        
        return {
          ...guest,
          mealChoice: guest.mealChoice?.id || null,
          dessertChoice: guest.dessertChoice?.id || null,
          isChild: isChildValue,
          responses: guest.responses.map(response => ({
            questionId: response.questionId,
            answer: response.answer
          }))
        };
      })
    }

    console.log('Transformed household data:', JSON.stringify(transformedHousehold.guests.map(g => ({
      name: g.name,
      isChild: g.isChild,
      typeOfIsChild: typeof g.isChild
    })), null, 2));

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
    const { responses } = await request.json()
    console.log("RSVP responses received:", responses)
    
    const household = await prisma.household.findFirst({
      where: {
        code: params.code,
      },
      include: {
        guests: true,
      },
    })

    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }

    // Process responses for each guest
    for (const guest of household.guests) {
      console.log(`Processing responses for guest: ${guest.name}`)
      console.log(`Current isChild value: ${guest.isChild} (${typeof guest.isChild})`)
      
      const isAttending = responses[`attending-${guest.id}`]
      const mealOptionId = responses[`meal-${guest.id}`]
      const dessertOptionId = responses[`dessert-${guest.id}`]

      await prisma.guest.update({
        where: {
          id: guest.id,
        },
        data: {
          isAttending,
          mealOptionId: isAttending ? mealOptionId : null,
          dessertOptionId: isAttending ? dessertOptionId : null,
          // We're intentionally NOT updating isChild here to preserve it
        },
      })

      // Log the meal and dessert choices in guest activity
      if (isAttending) {
        if (mealOptionId) {
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'UPDATE_MEAL',
              details: `Selected meal option: ${mealOptionId}`
            }
          })
        }
        
        if (dessertOptionId) {
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'UPDATE_DESSERT',
              details: `Selected dessert option: ${dessertOptionId}`
            }
          })
        }
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
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing RSVP:", error)
    return NextResponse.json({ error: "Failed to process RSVP" }, { status: 500 })
  }
}


