import { NextResponse } from "next/server"
import { StatisticsService } from "@/lib/services/statistics"

export async function GET() {
  try {
    const statisticsService = StatisticsService.getInstance()
    const stats = await statisticsService.getStatistics()

    if (!stats) {
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      )
    }

    // Transform the stats into the expected format, separating child and adult options
    const mealStats = stats.mealStats as any
    const dessertStats = stats.dessertStats as any

    const adultMealChoices = Object.values(mealStats)
      .filter((meal: any) => !meal.isChildOption)
      .map((meal: any) => ({
        name: meal.name,
        count: meal.count
      }))

    const childMealChoices = Object.values(mealStats)
      .filter((meal: any) => meal.isChildOption)
      .map((meal: any) => ({
        name: meal.name,
        count: meal.count
      }))

    const adultDessertChoices = Object.values(dessertStats)
      .filter((dessert: any) => !dessert.isChildOption)
      .map((dessert: any) => ({
        name: dessert.name,
        count: dessert.count
      }))

    const childDessertChoices = Object.values(dessertStats)
      .filter((dessert: any) => dessert.isChildOption)
      .map((dessert: any) => ({
        name: dessert.name,
        count: dessert.count
      }))

    const responseRate = stats.totalGuests > 0 
      ? Math.round((stats.respondedGuests / stats.totalGuests) * 100) 
      : 0

    return NextResponse.json({
      totalGuests: stats.totalGuests,
      respondedGuests: stats.respondedGuests,
      attendingGuests: stats.attendingGuests,
      notAttendingGuests: stats.notAttendingGuests,
      responseRate,
      mealChoices: {
        adult: adultMealChoices,
        child: childMealChoices
      },
      dessertChoices: {
        adult: adultDessertChoices,
        child: childDessertChoices
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