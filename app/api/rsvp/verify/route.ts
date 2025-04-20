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

    // First get raw data to validate isChild values
    const rawGuests = await prisma.guest.findMany({
      where: {
        household: {
          code: normalizedCode
        }
      },
      select: {
        id: true,
        name: true,
        isChild: true
      }
    });
    
    console.log("Raw guest data for isChild validation:");
    rawGuests.forEach(g => {
      console.log(`- Guest ${g.name} (${g.id}): raw isChild=${g.isChild}, type=${typeof g.isChild}`);
    });

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
          isChild: true, // Explicitly request isChild field
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

    // Transform the household data to parse options in responses and ensure isChild is a boolean
    const transformedHousehold = {
      ...household,
      guests: household?.guests.map(guest => {
        // Ensure isChild is a proper boolean using the raw data
        const rawGuest = rawGuests.find(g => g.id === guest.id);
        const isChildValue = rawGuest?.isChild === true;
        
        console.log(`Processing guest ${guest.name} for response:`);
        console.log(`- Raw isChild: ${rawGuest?.isChild} (${typeof rawGuest?.isChild})`);
        console.log(`- Setting isChild to: ${isChildValue} (${typeof isChildValue})`);
        
        return {
          ...guest,
          // Ensure isChild is a boolean
          isChild: isChildValue,
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

    // Log the final guest data being sent to the client
    console.log("Final guest data being sent to client:");
    transformedHousehold.guests.forEach(guest => {
      console.log(`- Guest ${guest.name}: isChild=${guest.isChild}, type=${typeof guest.isChild}`);
    });

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