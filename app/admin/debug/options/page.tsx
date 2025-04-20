"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

interface MealOption {
  id: string
  name: string
  isChildOption: boolean
  isActive: boolean
}

interface Child {
  id: string
  name: string
  householdName?: string
  mealChoice?: MealOption | null
  dessertChoice?: MealOption | null
}

export default function OptionsDebugPage() {
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [dessertOptions, setDessertOptions] = useState<MealOption[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setStatus("Fetching data...")
    try {
      const response = await fetch("/api/debug/force-update-child-options")
      const data = await response.json()
      
      // Process the data
      if (data.error) {
        setStatus(`Error: ${data.error}`)
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error
        })
      } else {
        // Format the meal options
        const updatedMealOptions = data.after.childMealOptions.map((option: MealOption) => ({
          ...option,
          type: "meal"
        }))
        
        // Format the dessert options
        const updatedDessertOptions = data.after.childDessertOptions.map((option: MealOption) => ({
          ...option,
          type: "dessert"
        }))
        
        // Format the children
        const formattedChildren = data.before.children.map((child: any) => ({
          id: child.id,
          name: child.name,
          householdName: child.household?.name,
          mealChoice: child.mealChoice,
          dessertChoice: child.dessertChoice
        }))
        
        setMealOptions(updatedMealOptions)
        setDessertOptions(updatedDessertOptions)
        setChildren(formattedChildren)
        
        setStatus(`Found ${updatedMealOptions.length} child meal options, ${updatedDessertOptions.length} child dessert options, and ${formattedChildren.length} children.`)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setStatus("Failed to fetch data. Check console for errors.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data. Check console for errors."
      })
    } finally {
      setLoading(false)
    }
  }

  const clearConsole = () => {
    console.clear()
    setStatus("Console cleared.")
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Debug Child Meal Options</h1>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
          <Button variant="outline" onClick={clearConsole}>
            Clear Console
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
        <p>{status}</p>
      </div>
      
      <Tabs defaultValue="options">
        <TabsList>
          <TabsTrigger value="options">Child Meal Options</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
        </TabsList>
        
        <TabsContent value="options" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Child Meal Options</CardTitle>
              </CardHeader>
              <CardContent>
                {mealOptions.length === 0 ? (
                  <p className="text-muted-foreground">No child meal options found.</p>
                ) : (
                  <ul className="space-y-2">
                    {mealOptions.map(option => (
                      <li key={option.id} className="flex items-center space-x-2">
                        <Checkbox id={`meal-${option.id}`} checked={option.isActive} />
                        <Label htmlFor={`meal-${option.id}`}>{option.name}</Label>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Child Dessert Options</CardTitle>
              </CardHeader>
              <CardContent>
                {dessertOptions.length === 0 ? (
                  <p className="text-muted-foreground">No child dessert options found.</p>
                ) : (
                  <ul className="space-y-2">
                    {dessertOptions.map(option => (
                      <li key={option.id} className="flex items-center space-x-2">
                        <Checkbox id={`dessert-${option.id}`} checked={option.isActive} />
                        <Label htmlFor={`dessert-${option.id}`}>{option.name}</Label>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="children">
          <Card>
            <CardHeader>
              <CardTitle>Children in the System</CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <p className="text-muted-foreground">No children found in the system.</p>
              ) : (
                <div className="space-y-4">
                  {children.map(child => (
                    <div key={child.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{child.name}</h3>
                        <span className="text-muted-foreground text-sm">
                          {child.householdName || "Unknown household"}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Meal Choice:</p>
                          <p className="text-muted-foreground">
                            {child.mealChoice?.name || "Not selected"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Dessert Choice:</p>
                          <p className="text-muted-foreground">
                            {child.dessertChoice?.name || "Not selected"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 