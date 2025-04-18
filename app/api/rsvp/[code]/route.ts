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
        // Force isChild to be a proper boolean value consistently
        let isChildValue: boolean;
        
        if (typeof guest.isChild === 'string') {
          // Convert string 'true'/'false' to boolean
          isChildValue = (guest.isChild as string).toLowerCase() === 'true';
        } else if (typeof guest.isChild === 'number') {
          // Convert numeric 1/0 to boolean
          isChildValue = (guest.isChild as number) === 1;
        } else {
          // For other types, use standard Boolean conversion
          isChildValue = Boolean(guest.isChild);
        }
        
        console.log(`Transforming guest ${guest.name}: raw isChild=${guest.isChild} (${typeof guest.isChild}) → normalized=${isChildValue} (${typeof isChildValue})`);
        
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
    const { guests: submittedGuests, householdResponses } = await request.json();
    
    // Log the received data for debugging
    console.log('Received RSVP data:', { 
      guests: submittedGuests, 
      householdResponses 
    });
    
    if (!submittedGuests || !Array.isArray(submittedGuests)) {
      return NextResponse.json({ 
        error: "Invalid guest data format" 
      }, { status: 400 });
    }
    
    // Normalize guest data before saving
    const normalizedGuests = submittedGuests.map((guest: any) => {
      // More robust boolean conversion for isChild
      let isChildValue: boolean;
      
      if (typeof guest.isChild === 'string') {
        // Convert string 'true'/'false' to boolean
        isChildValue = (guest.isChild as string).toLowerCase() === 'true';
      } else if (typeof guest.isChild === 'number') {
        // Convert numeric 1/0 to boolean
        isChildValue = (guest.isChild as number) === 1;
      } else {
        // For other types, use standard Boolean conversion
        isChildValue = Boolean(guest.isChild);
      }
      
      console.log(`Normalizing guest ${guest.name}: raw isChild=${guest.isChild} (${typeof guest.isChild}) → normalized=${isChildValue} (${typeof isChildValue})`);
      
      return {
        ...guest,
        isChild: isChildValue
      };
    });

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
      const isAttending = guest.isAttending === true;
      const isChild = guest.isChild === true; // Ensure it's truly boolean true
      
      if (isAttending && isChild) {
        console.log(`Validating child options for ${guest.name} (isChild=${isChild}, type: ${typeof isChild})`);
        
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

    // Process operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update household guests
      const updatedHousehold = await tx.household.update({
        where: {
          code: params.code,
        },
        data: {
          guests: {
            update: normalizedGuests.map((guest: any) => ({
              where: { id: guest.id },
              data: {
                isAttending: guest.isAttending,
                mealOptionId: guest.mealChoice,
                dessertOptionId: guest.dessertChoice,
                dietaryNotes: guest.dietaryNotes,
                isChild: guest.isChild,
              },
            })),
          },
        },
        include: {
          guests: true,
        },
      });

      // 2. Handle question responses: First, delete existing responses for these guests
      const guestIds = normalizedGuests.map(g => g.id);
      await tx.questionResponse.deleteMany({
        where: {
          guestId: {
            in: guestIds
          }
        }
      });

      // 3. Create all new responses
      const responsesToCreate = [];
      
      // Add guest-specific responses
      for (const guest of normalizedGuests) {
        if (guest.responses && Array.isArray(guest.responses)) {
          for (const response of guest.responses) {
            if (response.answer && response.answer.trim()) {
              responsesToCreate.push({
                guestId: guest.id,
                questionId: response.questionId,
                answer: response.answer.trim()
              });
            }
          }
        }
      }
      
      // Process household-level responses
      if (householdResponses && Array.isArray(householdResponses)) {
        // For household questions, assign response to the first attending guest
        const firstAttendingGuest = normalizedGuests.find(g => g.isAttending === true);
        
        if (firstAttendingGuest) {
          for (const response of householdResponses) {
            if (response.answer && response.answer.trim()) {
              responsesToCreate.push({
                guestId: firstAttendingGuest.id,
                questionId: response.questionId,
                answer: response.answer.trim()
              });
            }
          }
        }
      }
      
      // Create all responses in bulk if there are any
      if (responsesToCreate.length > 0) {
        await tx.questionResponse.createMany({
          data: responsesToCreate
        });
      }

      // 4. Log activity for meal and dessert choices
      const activities = [];
      for (const guest of normalizedGuests) {
        if (guest.isAttending) {
          if (guest.mealChoice) {
            const mealChoice = mealOptions.find(m => m.id === guest.mealChoice);
            activities.push({
              guestId: guest.id,
              action: 'UPDATE_MEAL',
              details: `Selected meal option: ${mealChoice?.name || guest.mealChoice}`
            });
          }
          
          if (guest.dessertChoice) {
            const dessertChoice = dessertOptions.find(d => d.id === guest.dessertChoice);
            activities.push({
              guestId: guest.id,
              action: 'UPDATE_DESSERT',
              details: `Selected dessert option: ${dessertChoice?.name || guest.dessertChoice}`
            });
          }
        }
      }
      
      // Create activities in bulk
      if (activities.length > 0) {
        await tx.guestActivity.createMany({
          data: activities
        });
      }
      
      return { 
        success: true, 
        household: updatedHousehold 
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing RSVP:", error);
    return NextResponse.json({ 
      error: "Failed to process RSVP",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}


