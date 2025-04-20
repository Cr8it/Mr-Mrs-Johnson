import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { searchTerm } = await request.json()
    if (!searchTerm) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    console.log(`RSVP search for term: "${searchTerm}"`);

    // First get raw data to validate isChild values
    const rawGuests = await prisma.guest.findMany({
      select: {
        id: true,
        name: true,
        isChild: true,
        household: {
          select: {
            id: true,
            code: true
          }
        }
      }
    });
    
    console.log("Raw guest data for isChild validation (search endpoint):");
    rawGuests.forEach(g => {
      console.log(`- Guest ${g.name} (${g.id}): raw isChild=${g.isChild}, type=${typeof g.isChild}, household=${g.household.code}`);
    });

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
            isChild: true, // Explicitly request isChild field
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
            isChild: true, // Explicitly request isChild field
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

    // Transform household data to parse options in responses and ensure isChild is a boolean
    const transformHousehold = (household: any) => {
      console.log(`Processing household: ${household.name}`);
      
      return {
        ...household,
        guests: household.guests.map((guest: any) => {
          // Ensure isChild is a proper boolean using the raw data
          const rawGuest = rawGuests.find(g => g.id === guest.id);
          const isChildValue = rawGuest?.isChild === true;
          
          console.log(`Processing guest ${guest.name} for search response:`);
          console.log(`- Raw isChild: ${rawGuest?.isChild} (${typeof rawGuest?.isChild})`);
          console.log(`- Setting isChild to: ${isChildValue} (${typeof isChildValue})`);
          
          return {
            ...guest,
            // Ensure isChild is a boolean with triple equals check
            isChild: isChildValue,
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
          };
        })
      };
    };

    if (codeMatch) {
      const transformedCodeMatch = transformHousehold(codeMatch);
      console.log("Exact code match found, returning household:", codeMatch.name);
      
      // Debug the final guest data
      transformedCodeMatch.guests.forEach((guest: any) => {
        console.log(`Final guest data: ${guest.name}, isChild=${guest.isChild} (${typeof guest.isChild})`);
      });
      
      return NextResponse.json({ 
        households: [{
          ...transformedCodeMatch,
          questions: transformedQuestions
        }]
      }, { status: 200 });
    }

    // Process all matched households
    const transformedHouseholds = matchedHouseholds.map(household => transformHousehold(household));
    
    console.log(`Found ${transformedHouseholds.length} matching households by name/partial match`);
    
    // Debug the first matched household's guest data
    if (transformedHouseholds.length > 0) {
      console.log(`First matched household: ${transformedHouseholds[0].name}`);
      transformedHouseholds[0].guests.forEach((guest: any) => {
        console.log(`Final guest data: ${guest.name}, isChild=${guest.isChild} (${typeof guest.isChild})`);
      });
    }

    // Add questions to each matched household
    return NextResponse.json({ 
      households: transformedHouseholds.map(household => ({
        ...household,
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


