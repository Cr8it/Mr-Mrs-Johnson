import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching admin statistics...")
    const startTime = Date.now()
    
    // Get basic statistics
    const [
      totalGuests,
      respondedGuests,
      attendingGuests,
      notAttendingGuests,
      totalHouseholds,
      dietaryRequirements
    ] = await Promise.all([
      prisma.guest.count(),
      prisma.guest.count({
        where: { isAttending: { not: null } }
      }),
      prisma.guest.count({
        where: { isAttending: true }
      }),
      prisma.guest.count({
        where: { isAttending: false }
      }),
      prisma.household.count(),
      prisma.guest.count({
        where: {
          NOT: { dietaryNotes: null }
        }
      })
    ]);

    console.log(`Basic statistics: ${attendingGuests} attending, ${notAttendingGuests} not attending, ${respondedGuests}/${totalGuests} responded`)

    // Get meal choices with counts - ensure we're getting fresh data
    const mealChoices = await prisma.mealOption.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            guests: {
              where: {
                isAttending: true  // Only count guests who are attending
              }
            }
          }
        }
      }
    }).then(meals => 
      meals.map(meal => ({
        name: meal.name,
        count: meal._count.guests
      }))
    );

    console.log("Meal choices statistics:", mealChoices)

    // Get dessert choices with counts - ensure we're getting fresh data
    const dessertChoices = await prisma.dessertOption.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            guests: {
              where: {
                isAttending: true  // Only count guests who are attending
              }
            }
          }
        }
      }
    }).then(desserts => 
      desserts.map(dessert => ({
        name: dessert.name,
        count: dessert._count.guests
      }))
    );

    console.log("Dessert choices statistics:", dessertChoices)

    const responseRate = totalGuests > 0 
      ? Math.round((respondedGuests / totalGuests) * 100) 
      : 0;

    const processingTime = Date.now() - startTime
    console.log(`Statistics fetched in ${processingTime}ms`)

    return NextResponse.json({
      totalGuests,
      respondedGuests,
      attendingGuests,
      notAttendingGuests,
      totalHouseholds,
      dietaryRequirements,
      responseRate,
      mealChoices,
      dessertChoices
    }, {
      headers: {
        // Add cache control headers to prevent caching
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error("Statistics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}