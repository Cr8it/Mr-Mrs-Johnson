"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle } from "lucide-react"
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"

interface Statistics {
  totalGuests: number
  respondedGuests: number
  attendingGuests: number
  notAttendingGuests: number
  totalHouseholds: number
  dietaryRequirements: number
  responseRate: number
  mealChoices: Array<{ name: string; count: number }>
  dessertChoices: Array<{ name: string; count: number }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899']

export default function Statistics({ className = "" }: { className?: string }) {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/statistics")
      if (!response.ok) throw new Error("Failed to fetch statistics")
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>Error: {error}</span>
      </div>
    )
  }

  if (!stats) return null

  const rsvpData = [
    { name: 'Attending', value: stats.attendingGuests },
    { name: 'Not Attending', value: stats.notAttendingGuests },
    { name: 'Pending', value: stats.totalGuests - stats.respondedGuests }
  ]

  return (
    <div className={`w-full h-full ${className}`}>
      <Tabs defaultValue="rsvp" className="h-full">
        <TabsList className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <TabsTrigger 
          value="rsvp" 
          className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 px-4"
          >
          RSVP Status
          </TabsTrigger>
          <TabsTrigger 
          value="meals" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 px-4"
          >
          Meal Preferences
          </TabsTrigger>
          <TabsTrigger 
          value="desserts" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 px-4"
          >
          Dessert Preferences
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 h-[calc(100%-60px)]">
          <TabsContent value="rsvp" className="h-full">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                  <Pie
                    data={rsvpData}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {rsvpData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} guests`, '']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '6px', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #E5E7EB',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                        <span className="text-gray-900 dark:text-gray-100">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

            <TabsContent value="meals" className="h-full">
            <div className="space-y-6">
                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              {stats.mealChoices.map((choice, index) => {
                const percentage = (choice.count / stats.respondedGuests) * 100;
                return (
                <div key={choice.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium dark:text-gray-100">{choice.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{choice.count} guests ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{
                    backgroundColor: `${COLORS[index % COLORS.length]}20`,
                  }}
                  />
                </div>
                );
              })}
              </div>
                <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                data={stats.mealChoices} 
                margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                barSize={40}
                >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#374151', fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ 
                  value: 'Number of Guests', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#374151' } 
                  }}
                />
                <Bar dataKey="count">
                  {stats.mealChoices.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                  ))}
                </Bar>
                <Tooltip 
                  formatter={(value) => [`${value} guests`, '']}
                  contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '6px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #E5E7EB',
                  padding: '8px 12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-900 dark:text-gray-100">{value}</span>
                  )}
                />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
            </TabsContent>

            <TabsContent value="desserts" className="h-full">
              <div className="space-y-6">
                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                {stats.dessertChoices.map((choice, index) => {
                const percentage = (choice.count / stats.respondedGuests) * 100;
                return (
                  <div key={choice.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium dark:text-gray-100">{choice.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{choice.count} guests ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                    backgroundColor: `${COLORS[index % COLORS.length]}20`,
                    }}
                  />
                  </div>
                );
                })}
              </div>
                <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats.dessertChoices} 
                  margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                  dataKey="name"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                  tick={{ fill: '#374151', fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ 
                    value: 'Number of Guests', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fill: '#374151' } 
                  }}
                  />
                  <Bar dataKey="count">
                  {stats.dessertChoices.map((entry, index) => (
                    <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                  </Bar>
                  <Tooltip 
                  formatter={(value) => [`${value} guests`, '']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '6px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #E5E7EB',
                    padding: '8px 12px'
                  }}
                  />
                  <Legend 
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-900 dark:text-gray-100">{value}</span>
                  )}
                  />
                </BarChart>
                </ResponsiveContainer>
              </div>
              </div>
            </TabsContent>
          </div>
          </Tabs>
        </div>
  )
}


