"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Option {
  id: string
  name: string
  isChildOption?: boolean
}

interface GuestInfo {
  id: string
  name: string
  isChild: boolean
  mealOptions: Option[]
  dessertOptions: Option[]
}

export default function ChildOptionsDebug({ householdCode }: { householdCode?: string }) {
  const [guestData, setGuestData] = useState<GuestInfo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optionsData, setOptionsData] = useState<{
    regularMeal: Option[]
    childMeal: Option[]
    regularDessert: Option[]
    childDessert: Option[]
  }>({
    regularMeal: [],
    childMeal: [],
    regularDessert: [],
    childDessert: []
  })

  useEffect(() => {
    if (householdCode) {
      loadData(householdCode)
    }
  }, [householdCode])

  const loadData = async (code: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Step 1: Load options
      const optionsResponse = await fetch('/api/rsvp/options')
      if (!optionsResponse.ok) {
        throw new Error('Failed to load meal and dessert options')
      }
      
      const optionsData = await optionsResponse.json()
      console.log("Options data:", optionsData)
      
      // Store the options
      setOptionsData({
        regularMeal: optionsData.mealOptions || [],
        childMeal: optionsData.childMealOptions || [],
        regularDessert: optionsData.dessertOptions || [],
        childDessert: optionsData.childDessertOptions || []
      })
      
      // Step 2: Load household data
      const householdResponse = await fetch(`/api/rsvp/${code}`)
      if (!householdResponse.ok) {
        throw new Error('Failed to load household data')
      }
      
      const householdData = await householdResponse.json()
      console.log("Household data:", householdData)
      
      // Process guest data
      const guests = householdData.household.guests.map((guest: any) => {
        const isChildValue = guest.isChild === true
        
        // Determine which options to use based on child status
        const guestMealOptions = isChildValue 
          ? optionsData.childMealOptions || [] 
          : optionsData.mealOptions || []
          
        const guestDessertOptions = isChildValue 
          ? optionsData.childDessertOptions || [] 
          : optionsData.dessertOptions || []
        
        return {
          id: guest.id,
          name: guest.name,
          isChild: isChildValue,
          mealOptions: guestMealOptions,
          dessertOptions: guestDessertOptions
        }
      })
      
      setGuestData(guests)
      setLoaded(true)
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!householdCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Child Options Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No household code provided</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Child Options Debug</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => householdCode && loadData(householdCode)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <h3 className="font-bold">Available Options:</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <h4 className="font-semibold">Meal Options:</h4>
                <p>Regular: {optionsData.regularMeal.length}</p>
                <p>Child: {optionsData.childMeal.length}</p>
              </div>
              <div>
                <h4 className="font-semibold">Dessert Options:</h4>
                <p>Regular: {optionsData.regularDessert.length}</p>
                <p>Child: {optionsData.childDessert.length}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-bold">Guests:</h3>
            <div className="space-y-4 mt-2">
              {guestData.map(guest => (
                <div key={guest.id} className="border p-3 rounded">
                  <h4 className="font-semibold">{guest.name}</h4>
                  <p>{guest.isChild ? 'Child' : 'Adult'}</p>
                  <p>Set as {guest.isChild ? 'Child' : 'Adult'}:</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <h5 className="font-medium">Available Options:</h5>
                      <p>Meal options: {guest.mealOptions.length}</p>
                      <p>Dessert options: {guest.dessertOptions.length}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">Selected Options:</h5>
                      <p>Meal: None</p>
                      <p>Dessert: None</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 