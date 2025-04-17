import { prisma } from "@/lib/db"

interface MealStats {
  [key: string]: {
    count: number
    name: string
    isChildOption: boolean
  }
}

interface DessertStats {
  [key: string]: {
    count: number
    name: string
    isChildOption: boolean
  }
}

export class StatisticsService {
  private static instance: StatisticsService
  private isUpdating: boolean = false
  private updateQueue: number = 0

  private constructor() {}

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService()
    }
    return StatisticsService.instance
  }

  private async calculateStatistics() {
    const [
      totalGuests,
      respondedGuests,
      attendingGuests,
      notAttendingGuests,
      mealChoices,
      dessertChoices
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
      prisma.mealOption.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { guests: true }
          }
        }
      }),
      prisma.dessertOption.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { guests: true }
          }
        }
      })
    ])

    const mealStats: MealStats = {}
    mealChoices.forEach(meal => {
      mealStats[meal.id] = {
        count: meal._count.guests,
        name: meal.name,
        isChildOption: meal.isChildOption
      }
    })

    const dessertStats: DessertStats = {}
    dessertChoices.forEach(dessert => {
      dessertStats[dessert.id] = {
        count: dessert._count.guests,
        name: dessert.name,
        isChildOption: dessert.isChildOption
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
  }

  public async updateStatistics() {
    if (this.isUpdating) {
      this.updateQueue++
      return
    }

    try {
      this.isUpdating = true
      const stats = await this.calculateStatistics()

      await prisma.statisticsCache.upsert({
        where: {
          id: 'current'
        },
        create: {
          id: 'current',
          ...stats,
          mealStats: stats.mealStats as any,
          dessertStats: stats.dessertStats as any,
          lastUpdated: new Date(),
          version: 1
        },
        update: {
          ...stats,
          mealStats: stats.mealStats as any,
          dessertStats: stats.dessertStats as any,
          lastUpdated: new Date(),
          version: { increment: 1 }
        }
      })
    } catch (error) {
      console.error('Error updating statistics:', error)
    } finally {
      this.isUpdating = false
      if (this.updateQueue > 0) {
        this.updateQueue--
        this.updateStatistics()
      }
    }
  }

  public async getStatistics() {
    const stats = await prisma.statisticsCache.findUnique({
      where: {
        id: 'current'
      }
    })

    if (!stats || Date.now() - stats.lastUpdated.getTime() > 5000) {
      await this.updateStatistics()
      return this.getStatistics()
    }

    return stats
  }
} 