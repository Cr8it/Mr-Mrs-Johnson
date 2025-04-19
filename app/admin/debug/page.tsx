"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [createdItems, setCreatedItems] = useState<{meal: string[], dessert: string[]} | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)
    setCreateSuccess(null)
    setCreatedItems(null)
    try {
      const response = await fetch("/api/debug/meal-options")
      if (!response.ok) throw new Error("Failed to fetch debug data")
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const createTestChildOptions = async () => {
    setLoading(true)
    setError(null)
    setCreateSuccess(null)
    setCreatedItems(null)
    try {
      const response = await fetch("/api/debug/create-test-child-options", {
        method: "POST"
      })
      if (!response.ok) throw new Error("Failed to create test options")
      const result = await response.json()
      
      if (result.success) {
        setCreateSuccess("Created child meal and dessert options successfully!")
        
        // Extract the created items for display
        const mealNames = result.created.mealOptions.map((o: any) => o.name)
        const dessertNames = result.created.dessertOptions.map((o: any) => o.name)
        setCreatedItems({
          meal: mealNames,
          dessert: dessertNames
        })
      }
      
      // Refresh data
      fetchDebugData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  if (loading && !data) return <div className="p-8">Loading debug data...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meal Options Debug</h1>
        <div className="flex gap-3">
          <Button onClick={createTestChildOptions} disabled={loading} variant="outline">
            Create Test Child Options
          </Button>
          <Button onClick={fetchDebugData} disabled={loading}>
            Refresh Data
          </Button>
        </div>
      </div>

      {createSuccess && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200">
          <p>{createSuccess}</p>
          {createdItems && (
            <div className="mt-2 text-sm">
              <p><strong>Created Meal Options:</strong> {createdItems.meal.join(", ")}</p>
              <p><strong>Created Dessert Options:</strong> {createdItems.dessert.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Debug Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/debug/household">
              <Button variant="outline" className="w-full">
                Check Specific Household
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Meal Options</dt>
                  <dd className="text-xl">{data.summary.totalMealOptions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Child Meal Options</dt>
                  <dd className="text-xl">{data.summary.childMealOptions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Regular Meal Options</dt>
                  <dd className="text-xl">{data.summary.regularMealOptions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Dessert Options</dt>
                  <dd className="text-xl">{data.summary.totalDessertOptions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Child Dessert Options</dt>
                  <dd className="text-xl">{data.summary.childDessertOptions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Regular Dessert Options</dt>
                  <dd className="text-xl">{data.summary.regularDessertOptions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Child Guests</dt>
                  <dd className="text-xl">{data.summary.childGuests}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Child Meal Options ({data.details.childMealOptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.details.childMealOptions.length === 0 ? (
                <p className="text-red-500 font-medium">No child meal options found!</p>
              ) : (
                <ul className="space-y-3">
                  {data.details.childMealOptions.map((option: any) => (
                    <li key={option.id} className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      {!option.isActive && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>}
                      <span className="text-sm text-gray-500">{option._count.guests} guest(s) selected</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Child Guests ({data.details.childGuests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.details.childGuests.length === 0 ? (
                <p className="text-amber-600 font-medium">No child guests found!</p>
              ) : (
                <ul className="space-y-4">
                  {data.details.childGuests.map((guest: any) => (
                    <li key={guest.id} className="border-b pb-2">
                      <h3 className="font-medium">{guest.name}</h3>
                      <p className="text-sm">
                        Attending: {guest.isAttending === null ? "No response" : (guest.isAttending ? "Yes" : "No")}
                      </p>
                      <div className="mt-1">
                        <p className="text-sm">
                          Meal: {guest.mealChoice ? (
                            <span>
                              {guest.mealChoice.name}
                              {guest.mealChoice.isChildOption ? 
                                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">Child Option</Badge> : 
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Adult Option</Badge>
                              }
                            </span>
                          ) : "None selected"}
                        </p>
                        <p className="text-sm">
                          Dessert: {guest.dessertChoice ? (
                            <span>
                              {guest.dessertChoice.name}
                              {guest.dessertChoice.isChildOption ? 
                                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">Child Option</Badge> : 
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Adult Option</Badge>
                              }
                            </span>
                          ) : "None selected"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 