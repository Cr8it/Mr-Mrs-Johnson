import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { searchTerm } = await request.json()
    if (!searchTerm) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    // Try exact code match first
    const codeMatch = await prisma.household.findFirst({
      where: { code: searchTerm },
      include: {
      guests: {
        select: {
        id: true,
        name: true,
        isAttending: true,
        mealChoice: true,
        dessertChoice: true,
        dietaryNotes: true,
        responses: {
          select: {
          questionId: true,
          answer: true,
          question: {
            select: {
            question: true,
            type: true,
            options: true,
            isRequired: true
            }
          }
          }
        }
        }
      }
      }
    });

    // Get all households and guests with full details
    const allHouseholds = await prisma.household.findMany({
      include: {
      guests: {
        select: {
        id: true,
        name: true,
        isAttending: true,
        mealChoice: true,
        dessertChoice: true,
        dietaryNotes: true,
        responses: {
          select: {
          questionId: true,
          answer: true,
          question: {
            select: {
            question: true,
            type: true,
            options: true,
            isRequired: true
            }
          }
          }
        }
        }
      }
      }
    });

    // Also fetch active questions
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
      id: true,
      question: true,
      type: true,
      options: true,
      isRequired: true
      }
    });

    // Filter in memory for case-insensitive search
    const matchedHouseholds = allHouseholds.filter(household => {
      const searchLower = searchTerm.toLowerCase()
      const householdMatch = household.name.toLowerCase().includes(searchLower)
      const guestMatch = household.guests.some(guest => 
      guest.name.toLowerCase().includes(searchLower)
      )
      return householdMatch || guestMatch
    })

    if (matchedHouseholds.length === 0) {
      return NextResponse.json({ error: "No household found for that name" }, { status: 404 })
    }

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

    // Transform household data to parse options in responses
    const transformHousehold = (household: any) => ({
      ...household,
      guests: household.guests.map((guest: any) => ({
      ...guest,
      responses: guest.responses.map((response: any) => ({
        ...response,
        question: {
        ...response.question,
        options: response.question.type === "MULTIPLE_CHOICE" ? 
          (() => {
          try {
            return JSON.parse(response.question.options)
          } catch {
            return []
          }
          })() : 
          []
        }
      }))
      }))
    })

    if (codeMatch) {
      return NextResponse.json({ 
      households: [{
        ...transformHousehold(codeMatch),
        questions: transformedQuestions
      }]
      }, { status: 200 });
    }

    // Add questions to each matched household
    return NextResponse.json({ 
      households: matchedHouseholds.map(household => ({
      ...transformHousehold(household),
      questions: transformedQuestions
      }))
    }, { status: 200 });

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to search for RSVP" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}


