import { PrismaClient } from "@prisma/client"

export class StatisticsService {
  private static instance: StatisticsService
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient()
  }

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService()
    }
    return StatisticsService.instance
  }

  public async getStatistics() {
    try {
      // Get all guests
      const guests = await this.prisma.guest.findMany({
        include: {
          mealOption: true,
          dessertOption: true
        }
      })

      // Get all meal and dessert options
      const mealOptions = await this.prisma.mealOption.findMany()
      const dessertOptions = await this.prisma.dessertOption.findMany()

      // Initialize meal and dessert stats
      const mealStats: { [key: string]: { name: string; count: number; isChildOption: boolean } } = {}
      const dessertStats: { [key: string]: { name: string; count: number; isChildOption: boolean } } = {}

      // Initialize stats for all options with 0 counts
      mealOptions.forEach((option) => {
        mealStats[option.id] = {
          name: option.name,
          count: 0,
          isChildOption: option.isChildOption || false
        }
      })

      dessertOptions.forEach((option) => {
        dessertStats[option.id] = {
          name: option.name,
          count: 0,
          isChildOption: option.isChildOption || false
        }
      })

      // Count responses
      let totalGuests = guests.length
      let respondedGuests = 0
      let attendingGuests = 0
      let notAttendingGuests = 0

      guests.forEach((guest) => {
        if (guest.hasResponded) {
          respondedGuests++
          if (guest.isAttending) {
            attendingGuests++
            // Only count meal/dessert choices for attending guests
            if (guest.mealOptionId && mealStats[guest.mealOptionId]) {
              mealStats[guest.mealOptionId].count++
            }
            if (guest.dessertOptionId && dessertStats[guest.dessertOptionId]) {
              dessertStats[guest.dessertOptionId].count++
            }
          } else {
            notAttendingGuests++
          }
        }
      })

      return {
        totalGuests,
        respondedGuests,
        attendingGuests,
        notAttendingGuests,
        mealStats,
        dessertStats
      }
    } catch (error) {
      console.error("Error getting statistics:", error)
      return null
    }
  }
} 