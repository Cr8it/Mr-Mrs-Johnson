import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
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

    // Transform the data to include existing choices
    const transformedHousehold = {
      ...household,
      guests: household.guests.map(guest => ({
        ...guest,
        mealChoice: guest.mealChoice?.id || null,
        dessertChoice: guest.dessertChoice?.id || null,
        responses: guest.responses.map(response => ({
          questionId: response.questionId,
          answer: response.answer
        }))
      }))
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
      const isAttending = responses[`attending-${guest.id}`]

      await prisma.guest.update({
        where: {
          id: guest.id,
        },
        data: {
          isAttending,
        },
      })

      if (isAttending) {
        // Save guest-specific responses
        const guestResponses = Object.entries(responses)
          .filter(([key]) => key.endsWith(`-${guest.id}`))
          .map(([key, value]) => ({
            questionId: key.split("-")[0],
            guestId: guest.id,
            answer: String(value),
          }))

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

    await prisma.questionResponse.createMany({
      data: householdResponses,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing RSVP:", error)
    return NextResponse.json({ error: "Failed to process RSVP" }, { status: 500 })
  }
}


