"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Reload, Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  selectedMeal?: string
  selectedDessert?: string
}

export default function ChildOptionsDebug({ householdCode }: { householdCode?: string }) {
  const [guestData, setGuestData] = useState<GuestInfo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("data")
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

  // Load data when household code changes or when refresh is triggered
  useEffect(() => {
    if (householdCode) {
      loadData(householdCode)
    }
  }, [householdCode, refreshTrigger])

  // Auto-refresh every 5 seconds if expanded
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (expanded) {
      interval = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expanded]);

  const loadData = async (code: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Get localStorage data first to check selections
      const storageKey = `rsvp-${code}`;
      const savedResponsesRaw = localStorage.getItem(storageKey);
      const savedResponses = savedResponsesRaw ? JSON.parse(savedResponsesRaw) : null;
      
      // Also check global responses
      const currentResponses: Record<string, string> = {};
      
      if (typeof window !== 'undefined') {
        // Scan localStorage for any keys like attending-, meal-, dessert-
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('meal-') || key.startsWith('dessert-') || key.startsWith('attending-'))) {
            try {
              const value = localStorage.getItem(key);
              if (value) currentResponses[key] = value;
            } catch (e) {
              console.error("Error parsing localStorage item:", e);
            }
          }
        }
      }
      
      // Step 1: Load options
      const optionsResponse = await fetch('/api/rsvp/options')
      if (!optionsResponse.ok) {
        throw new Error('Failed to load meal and dessert options')
      }
      
      const optionsData = await optionsResponse.json()
      console.log("Debug: Options data:", optionsData)
      
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
      console.log("Debug: Household data:", householdData)
      
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
          
        // Try to get selections from localStorage or existing guest data
        const mealKey = `meal-${guest.id}`;
        const dessertKey = `dessert-${guest.id}`;
        
        // Check multiple sources for the current selections
        const selectedMeal = 
          guest.mealChoice || 
          (savedResponses && savedResponses[mealKey]) || 
          currentResponses[mealKey];
          
        const selectedDessert = 
          guest.dessertChoice || 
          (savedResponses && savedResponses[dessertKey]) || 
          currentResponses[dessertKey];
        
        return {
          id: guest.id,
          name: guest.name,
          isChild: isChildValue,
          mealOptions: guestMealOptions,
          dessertOptions: guestDessertOptions,
          selectedMeal,
          selectedDessert
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

  // Converts option ID to name for display
  const getOptionName = (optionId: string | undefined, options: Option[]) => {
    if (!optionId) return "None";
    const option = options.find(o => o.id === optionId);
    return option ? option.name : "Unknown";
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

  // Simplified view if not expanded
  if (!expanded) {
    return (
      <div className="mb-4 bg-yellow-100 text-yellow-800 p-3 rounded flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Debug Tools</h3>
          <p className="text-sm">Expand to see child options debug information</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
          <Eye className="h-4 w-4 mr-1" />
          Show
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 border-yellow-500">
      <CardHeader className="bg-yellow-50">
        <CardTitle className="flex justify-between items-center">
          <span>Child Options Debug</span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              disabled={loading}
            >
              <Reload className="h-4 w-4 mr-1" />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setExpanded(false)}
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Hide
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="data">Guest Data</TabsTrigger>
            <TabsTrigger value="options">Available Options</TabsTrigger>
            <TabsTrigger value="help">Help & Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="space-y-4">
            <div>
              <h3 className="font-bold">Guests and Their Options:</h3>
              <div className="space-y-4 mt-2">
                {guestData.map(guest => (
                  <div key={guest.id} className={`border p-3 rounded ${guest.isChild ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}>
                    <div className="flex justify-between">
                      <h4 className="font-semibold">{guest.name}</h4>
                      <Badge variant={guest.isChild ? "secondary" : "outline"}>
                        {guest.isChild ? 'Child' : 'Adult'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <h5 className="font-medium">Meal Options:</h5>
                        <p className="text-sm">Using {guest.isChild ? 'child' : 'adult'} menu ({guest.mealOptions.length} options)</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="mt-1">
                            {getOptionName(guest.selectedMeal, [...optionsData.regularMeal, ...optionsData.childMeal])}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium">Dessert Options:</h5>
                        <p className="text-sm">Using {guest.isChild ? 'child' : 'adult'} menu ({guest.dessertOptions.length} options)</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="mt-1">
                            {getOptionName(guest.selectedDessert, [...optionsData.regularDessert, ...optionsData.childDessert])}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="options">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Available Options:</h3>
                <div className="grid grid-cols-2 gap-6 mt-3">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Adult Meal Options ({optionsData.regularMeal.length}):</h4>
                    {optionsData.regularMeal.length === 0 ? (
                      <p className="text-red-500">No adult meal options defined</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {optionsData.regularMeal.map(option => (
                          <li key={option.id} className="text-sm">{option.name}</li>
                        ))}
                      </ul>
                    )}
                    
                    <h4 className="font-semibold mt-4">Child Meal Options ({optionsData.childMeal.length}):</h4>
                    {optionsData.childMeal.length === 0 ? (
                      <p className="text-red-500">No child meal options defined</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {optionsData.childMeal.map(option => (
                          <li key={option.id} className="text-sm">{option.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Adult Dessert Options ({optionsData.regularDessert.length}):</h4>
                    {optionsData.regularDessert.length === 0 ? (
                      <p className="text-red-500">No adult dessert options defined</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {optionsData.regularDessert.map(option => (
                          <li key={option.id} className="text-sm">{option.name}</li>
                        ))}
                      </ul>
                    )}
                    
                    <h4 className="font-semibold mt-4">Child Dessert Options ({optionsData.childDessert.length}):</h4>
                    {optionsData.childDessert.length === 0 ? (
                      <p className="text-red-500">No child dessert options defined</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {optionsData.childDessert.map(option => (
                          <li key={option.id} className="text-sm">{option.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="help">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Debugging Child Options</h3>
                <p className="mt-2">This debug panel helps identify issues with child meal and dessert options:</p>
                
                <ul className="list-disc pl-5 mt-3 space-y-2">
                  <li><strong>Child Status:</strong> Each guest's isChild status determines which menu they see.</li>
                  <li><strong>Options Availability:</strong> Children should see child options, adults should see adult options.</li>
                  <li><strong>Current Selections:</strong> Shows what meal/dessert choices are currently selected.</li>
                </ul>
                
                <h4 className="font-semibold mt-4">Common Issues:</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>No child options:</strong> Child guests will see "No options available" if none are defined.</li>
                  <li><strong>Incorrect isChild status:</strong> Guest might be marked as child in DB but showing as adult.</li>
                  <li><strong>Not showing options:</strong> Attendance status might be affecting visibility.</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 