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
        // Force isChild to be a proper boolean value without using string methods
        const rawValue = guest.isChild;
        // Use safe conversion that works regardless of type
        const isChildValue = (() => {
          if (typeof rawValue === 'string') {
            return rawValue === 'true' || rawValue === 'TRUE';
          }
          return Boolean(rawValue);
        })();
        
        console.log(`Transforming guest ${guest.name}: raw isChild=${rawValue} → transformed=${isChildValue}`);
        
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

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const household = await request.json();
    
    // Normalize guest data
    const normalizedGuests = household.guests.map((guest: any) => ({
      ...guest,
      isChild: guest.isChild === true
    }));

    // Fetch all meal and dessert options for validation
    const [mealOptions, dessertOptions] = await Promise.all([
      prisma.mealOption.findMany({
        where: { isActive: true }
      }),
      prisma.dessertOption.findMany({
        where: { isActive: true }
      })
    ]);

    // Validate child options
    for (const guest of normalizedGuests) {
      if (guest.isAttending && guest.isChild) {
        if (guest.mealChoice) {
          const selectedMeal = mealOptions.find(m => m.id === guest.mealChoice);
          if (!selectedMeal?.isChildOption) {
            return NextResponse.json({ 
              error: `Invalid meal choice for child guest ${guest.name}. Must select a children's meal option.` 
            }, { status: 400 });
          }
        }

        if (guest.dessertChoice) {
          const selectedDessert = dessertOptions.find(d => d.id === guest.dessertChoice);
          if (!selectedDessert?.isChildOption) {
            return NextResponse.json({ 
              error: `Invalid dessert choice for child guest ${guest.name}. Must select a children's dessert option.` 
            }, { status: 400 });
          }
        }
      }
    }

    // Update household with normalized and validated guests
    const updatedHousehold = await prisma.household.update({
      where: {
        code: params.code,
      },
      data: {
        guests: {
          update: normalizedGuests.map((guest: any) => ({
            where: { id: guest.id },
            data: {
              isAttending: guest.isAttending,
              mealChoice: guest.mealChoice,
              dessertChoice: guest.dessertChoice,
              dietaryNotes: guest.dietaryNotes,
              isChild: guest.isChild,
              responses: guest.responses
            },
          })),
        },
      },
      include: {
        guests: true,
      },
    });

    // Log the meal and dessert choices in guest activity
    for (const guest of normalizedGuests) {
      if (guest.isAttending) {
        if (guest.mealChoice) {
          const mealChoice = mealOptions.find(m => m.id === guest.mealChoice);
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'UPDATE_MEAL',
              details: `Selected meal option: ${mealChoice?.name || guest.mealChoice}`
            }
          });
        }
        
        if (guest.dessertChoice) {
          const dessertChoice = dessertOptions.find(d => d.id === guest.dessertChoice);
          await prisma.guestActivity.create({
            data: {
              guestId: guest.id,
              action: 'UPDATE_DESSERT',
              details: `Selected dessert option: ${dessertChoice?.name || guest.dessertChoice}`
            }
          });
        }
      }
    }

    return NextResponse.json({ household: updatedHousehold });
  } catch (error) {
    console.error("Error processing RSVP:", error)
    return NextResponse.json({ 
      error: "Failed to process RSVP",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


