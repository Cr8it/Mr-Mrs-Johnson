"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Statistics from "./components/Statistics"
import { ActivityLog } from "./components/ActivityLog"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Calendar, 
  Mail, 
  Utensils,
  ArrowRight,
  TrendingUp,
  Clock,
  CakeSlice,
  Coffee
} from "lucide-react"

interface Stats {
  totalGuests: number
  respondedGuests: number
  attendingGuests: number
  notAttendingGuests: number
  responseRate: number
  mealChoices: Array<{ name: string; count: number }>
  dessertChoices: Array<{ name: string; count: number }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthsUntil, setMonthsUntil] = useState<number>(0)

  useEffect(() => {
    const isAuthenticated = document.cookie.includes('adminAuthenticated=true')
    if (!isAuthenticated) {
      router.push('/admin/login')
    }
    fetchStats()
  }, [router])

  useEffect(() => {
    const fetchWeddingDate = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        if (data && data.weddingDate) {
          const weddingDate = new Date(data.weddingDate)
          const now = new Date()
          const months = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
          setMonthsUntil(months)
        }
      } catch (error) {
        console.error('Error fetching wedding date:', error)
      }
    }
    fetchWeddingDate()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/statistics")
      if (!response.ok) throw new Error("Failed to fetch statistics")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your wedding planning.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gold/10 text-gold px-4 py-2 rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Wedding in {monthsUntil} months</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalGuests || 0}</div>
            <div className="text-xs text-gray-600 mt-1">Invited guests</div>

          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">RSVPs Received</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.respondedGuests || 0}</div>
            <div className="text-xs text-gray-600 mt-1">{stats?.responseRate || 0}% response rate</div>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Attending</CardTitle>
            <Mail className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.attendingGuests || 0}</div>
            <div className="text-xs text-green-600 mt-1">Confirmed guests</div>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Not Attending</CardTitle>
            <Utensils className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.notAttendingGuests || 0}</div>
            <div className="text-xs text-orange-600 mt-1">Declined invitations</div>
            </CardContent>
          </Card>
          </div>

            {/* Meal & Dessert Preferences */}
            <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white">
              <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-gold" />
                <CardTitle className="text-xl font-semibold text-gray-900">Meal Preferences</CardTitle>
              </div>
              </CardHeader>
              <CardContent className="pt-6">
              <div className="space-y-6">
                {stats?.mealChoices.map((meal, index) => {
                const percentage = stats.attendingGuests > 0 
                  ? (meal.count / stats.attendingGuests) * 100 
                  : 0
                return (
                  <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{meal.name}</span>
                    <span className="font-semibold text-gray-900">{meal.count} guests</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2" 
                    indicatorClassName={`bg-gradient-to-r ${
                    index === 0 ? 'from-blue-500 to-blue-600' :
                    index === 1 ? 'from-emerald-500 to-emerald-600' :
                    index === 2 ? 'from-amber-500 to-amber-600' :
                    'from-violet-500 to-violet-600'
                    }`}
                  />
                  </div>
                )
                })}
              </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CakeSlice className="h-5 w-5 text-gold" />
                <CardTitle className="text-xl font-semibold text-gray-900">Dessert Preferences</CardTitle>
              </div>
              </CardHeader>
              <CardContent className="pt-6">
              <div className="space-y-6">
                {stats?.dessertChoices.map((dessert, index) => {
                const percentage = stats.attendingGuests > 0 
                  ? (dessert.count / stats.attendingGuests) * 100 
                  : 0
                return (
                  <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{dessert.name}</span>
                    <span className="font-semibold text-gray-900">{dessert.count} guests</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2" 
                    indicatorClassName={`bg-gradient-to-r ${
                    index === 0 ? 'from-pink-500 to-pink-600' :
                    index === 1 ? 'from-purple-500 to-purple-600' :
                    index === 2 ? 'from-indigo-500 to-indigo-600' :
                    'from-cyan-500 to-cyan-600'
                    }`}
                  />
                  </div>
                )
                })}
              </div>
              </CardContent>
            </Card>
            </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2">
          {/* Activity Timeline */}
          <Card className="col-span-1 bg-white">
            <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            <ActivityLog className="max-h-[400px] overflow-auto p-6" />
            </CardContent>
          </Card>

          {/* Statistics Chart */}
          <Card className="col-span-1 bg-white">
            <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900">RSVP Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
            <div className="h-[400px]">
              <Statistics className="h-full" />
            </div>
            </CardContent>
          </Card>
          </div>



      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Guest Management",
              description: "View and manage your guest list, RSVPs, and meal preferences",
              href: "/admin/guests",
              color: "bg-blue-500"
            },
            {
              title: "Questions",
              description: "Manage custom questions for your guests",
              href: "/admin/questions",
              color: "bg-purple-500"
            },
            {
              title: "Menu Options",
              description: "Manage meal and dessert options for your guests",
              href: "/admin/menu-options",
              color: "bg-gold"
            }
          ].map((action) => (
            <Card 
              key={action.title} 
              className="group hover:shadow-lg transition-all cursor-pointer bg-white" 
              onClick={() => router.push(action.href)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  {action.title}
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{action.description}</p>
                <div className={`mt-4 h-2 rounded-full ${action.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

