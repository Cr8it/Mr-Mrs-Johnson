import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
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

    // Get meal choices with counts
    const mealChoices = await prisma.mealOption.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            guests: true
          }
        }
      }
    }).then(meals => 
      meals.map(meal => ({
        name: meal.name,
        count: meal._count.guests
      }))
    );

    // Get dessert choices with counts
    const dessertChoices = await prisma.dessertOption.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            guests: true
          }
        }
      }
    }).then(desserts => 
      desserts.map(dessert => ({
        name: dessert.name,
        count: dessert._count.guests
      }))
    );

    const responseRate = totalGuests > 0 
      ? Math.round((respondedGuests / totalGuests) * 100) 
      : 0;

    console.log("Statistics data:", {
      totalGuests,
      respondedGuests,
      attendingGuests,
      notAttendingGuests,
      totalHouseholds,
      dietaryRequirements,
      responseRate,
      mealChoices,
      dessertChoices
    });

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
    })
  } catch (error) {
    console.error("Statistics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}