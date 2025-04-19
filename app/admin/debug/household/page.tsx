"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function HouseholdDebugPage() {
  const [code, setCode] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fixSuccess, setFixSuccess] = useState<string | null>(null)
  const [guestsToFix, setGuestsToFix] = useState<Record<string, boolean>>({})

  const checkHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) return
    
    setLoading(true)
    setError(null)
    setData(null)
    
    try {
      const response = await fetch(`/api/debug/household-children?code=${encodeURIComponent(code)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch household data")
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (data?.guests) {
      const initialState: Record<string, boolean> = {}
      data.guests.forEach((guest: any) => {
        initialState[guest.id] = guest.isChild || false
      })
      setGuestsToFix(initialState)
    }
  }, [data])

  const toggleGuestChildStatus = (guestId: string) => {
    setGuestsToFix(prev => ({
      ...prev,
      [guestId]: !prev[guestId]
    }))
  }

  const applyFixes = async () => {
    if (!data || !code) return
    
    setFixing(true)
    setError(null)
    setFixSuccess(null)
    
    try {
      const guestUpdates = data.guests
        .filter((guest: any) => guestsToFix[guest.id] !== guest.isChild)
        .map((guest: any) => ({
          guestId: guest.id,
          isChild: guestsToFix[guest.id]
        }))
      
      if (guestUpdates.length === 0) {
        setFixSuccess("No changes to apply")
        setFixing(false)
        return
      }
      
      const response = await fetch(`/api/debug/fix-children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          guestUpdates
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply fixes")
      }
      
      const result = await response.json()
      
      setFixSuccess(`Successfully updated ${result.results.filter((r: any) => r.success).length} guests`)
      
      checkHousehold(new Event("submit") as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setFixing(false)
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Household Children Debug</h1>
        <Button onClick={() => window.history.back()} variant="outline">
          Back to Debug Menu
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Check Household</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={checkHousehold} className="flex gap-3">
            <Input 
              placeholder="Enter household code" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              className="max-w-xs"
            />
            <Button type="submit" disabled={loading || !code}>
              {loading ? "Checking..." : "Check"}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{data.householdName}</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={applyFixes} 
                  disabled={fixing || loading}
                >
                  {fixing ? "Applying..." : "Apply Child Status Fixes"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fixSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
                  {fixSuccess}
                </div>
              )}
            
              <div className="space-y-4">
                <h3 className="font-semibold">Available Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Meal Options:</h4>
                    <div className="space-y-1">
                      <p>Regular: {data.availableOptions.regularMealOptions.length}</p>
                      <p>Child: {data.availableOptions.childMealOptions.length}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Dessert Options:</h4>
                    <div className="space-y-1">
                      <p>Regular: {data.availableOptions.regularDessertOptions.length}</p>
                      <p>Child: {data.availableOptions.childDessertOptions.length}</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold mt-6">Guests:</h3>
                <ul className="space-y-6">
                  {data.guests.map((guest: any) => (
                    <li key={guest.id} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{guest.name}</h4>
                        {guest.isChild ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Child</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">Adult</Badge>
                        )}
                        
                        <div className="ml-auto flex items-center gap-2">
                          <div className="text-sm text-gray-500">
                            Set as {guestsToFix[guest.id] ? "Child" : "Adult"}:
                          </div>
                          <div 
                            className={`w-10 h-6 rounded-full cursor-pointer transition-colors ${
                              guestsToFix[guest.id] ? "bg-blue-500" : "bg-gray-300"
                            } relative`}
                            onClick={() => toggleGuestChildStatus(guest.id)}
                          >
                            <div 
                              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
                                guestsToFix[guest.id] ? "left-5" : "left-1"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div className="p-2 bg-yellow-50 border border-yellow-100 rounded-md">
                          <p><strong>Raw Database Values:</strong></p>
                          <p className="font-mono">isChild: {String(guest.rawIsChild)} (type: {guest.rawIsChildType})</p>
                          <p className="font-mono">Processed isChild: {String(guest.isChild)} (type: {guest.isChildType})</p>
                        </div>
                        
                        <div>
                          <p><strong>Available Options:</strong></p>
                          <p>Meal options: {guest.availableOptions.mealOptions}</p>
                          <p>Dessert options: {guest.availableOptions.dessertOptions}</p>
                        </div>
                        
                        <div>
                          <p><strong>Selected Options:</strong></p>
                          <p>Meal: {guest.mealChoice ? "Selected" : "None"}</p>
                          <p>Dessert: {guest.dessertChoice ? "Selected" : "None"}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 