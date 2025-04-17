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

    // Transform the stats into the expected format
    const mealChoices = Object.values(stats.mealStats as any).map(
      (meal: any) => ({
        name: meal.name,
        count: meal.count
      })
    )

    const dessertChoices = Object.values(stats.dessertStats as any).map(
      (dessert: any) => ({
        name: dessert.name,
        count: dessert.count
      })
    )

    const responseRate = stats.totalGuests > 0 
      ? Math.round((stats.respondedGuests / stats.totalGuests) * 100) 
      : 0

    return NextResponse.json({
      totalGuests: stats.totalGuests,
      respondedGuests: stats.respondedGuests,
      attendingGuests: stats.attendingGuests,
      notAttendingGuests: stats.notAttendingGuests,
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