import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Get the household code from the URL
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ error: "Missing household code parameter" }, { status: 400 })
    }
    
    console.log(`DEBUG: Checking household with code: ${code}`)
    
    // First get the raw guest data directly
    const rawGuests = await prisma.guest.findMany({
      where: {
        household: {
          code
        }
      },
      select: {
        id: true,
        name: true,
        isChild: true
      }
    })
    
    // Get full household data
    const household = await prisma.household.findFirst({
      where: {
        code
      },
      include: {
        guests: {
          include: {
            mealChoice: true,
            dessertChoice: true
          }
        }
      }
    })
    
    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }
    
    // Get available meal options
    const [regularMealOptions, childMealOptions, regularDessertOptions, childDessertOptions] = await Promise.all([
      prisma.mealOption.findMany({
        where: { 
          isActive: true,
          isChildOption: false
        },
        select: { id: true, name: true, isChildOption: true }
      }),
      prisma.mealOption.findMany({
        where: { 
          isActive: true,
          isChildOption: true
        },
        select: { id: true, name: true, isChildOption: true }
      }),
      prisma.dessertOption.findMany({
        where: { 
          isActive: true,
          isChildOption: false
        },
        select: { id: true, name: true, isChildOption: true }
      }),
      prisma.dessertOption.findMany({
        where: { 
          isActive: true,
          isChildOption: true
        },
        select: { id: true, name: true, isChildOption: true }
      })
    ])
    
    // Transform the data just like the RSVP endpoint does
    const processedGuests = household.guests.map(guest => {
      const rawDbValue = rawGuests.find(g => g.id === guest.id)?.isChild
      const isChildValue = rawDbValue === true
      
      return {
        id: guest.id,
        name: guest.name,
        mealChoice: guest.mealChoice?.id || null,
        dessertChoice: guest.dessertChoice?.id || null,
        rawIsChild: rawDbValue,
        rawIsChildType: typeof rawDbValue,
        isChild: isChildValue,
        isChildType: typeof isChildValue,
        availableOptions: {
          mealOptions: isChildValue ? childMealOptions.length : regularMealOptions.length,
          dessertOptions: isChildValue ? childDessertOptions.length : regularDessertOptions.length
        }
      }
    })
    
    return NextResponse.json({
      householdName: household.name,
      guests: processedGuests,
      availableOptions: {
        regularMealOptions,
        childMealOptions,
        regularDessertOptions,
        childDessertOptions
      }
    })
  } catch (error) {
    console.error("DEBUG Error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve debug information" },
      { status: 500 }
    )
  }
} 