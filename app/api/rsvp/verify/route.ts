import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Request body:", body)
    
    if (!body.code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      )
    }

    const { code } = body
    console.log("Verifying code:", code)

    // Normalize the code (uppercase and remove spaces)
    const normalizedCode = code.toUpperCase().replace(/\s+/g, '')

    const [household, questions] = await Promise.all([
      prisma.household.findFirst({
      where: {
        code: normalizedCode
      },
      select: {
        name: true,
        code: true,
        guests: {
        select: {
          id: true,
          name: true,
          email: true,
          isAttending: true,
          isChild: true,
          mealChoice: true, // Include full meal choice data
          dessertChoice: true, // Include full dessert choice data
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
      }),
      prisma.question.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        question: true,
        type: true,
        options: true,
        isRequired: true
      }
      })
    ])

    if (!household) {
      console.log("No household found for code:", normalizedCode)
      return NextResponse.json(
      { error: "Invalid code. Please check and try again." },
      { status: 404 }
      )
    }

    console.log("Found household:", household.name)

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

    // Transform the household data to parse options in responses
    const transformedHousehold = {
      ...household,
      guests: household?.guests.map(guest => {
        // Log the raw data from the database
        console.log(`Raw guest data for ${guest.name}:`, { 
          isChild: guest.isChild, 
          typeOf: typeof guest.isChild
        });
        
        return {
          ...guest,
          // Force isChild to be a boolean - might be coming as a string "TRUE" or "FALSE"
          isChild: guest.isChild === true || guest.isChild === "TRUE" || guest.isChild === "true",
          responses: guest.responses.map(response => ({
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
        };
      })
    }
    
    console.log('Child guest check (after transformation):', transformedHousehold.guests.map(g => ({ 
      name: g.name, 
      isChild: g.isChild, 
      typeOfIsChild: typeof g.isChild 
    })));

    return NextResponse.json({
      success: true,
      household: {
      ...transformedHousehold,
      questions: transformedQuestions
      }
    })
  } catch (error) {
    console.error("RSVP verification error:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to verify RSVP code" },
      { status: 500 }
    )
  }
}