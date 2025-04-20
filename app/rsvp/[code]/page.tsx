"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Question, Option } from "@/components/types"

// Local interface since this file uses different property names
interface LocalGuest {
  id: string
  name: string
  isAttending?: boolean
  mealOptionId?: string
  dessertOptionId?: string
  isChild?: boolean
}

// Define types for API responses
interface GuestResponse {
  id: string
  name: string
  isChild?: boolean
  mealChoice?: string | null
  dessertChoice?: string | null
  [key: string]: any
}

interface HouseholdResponse {
  name: string
  guests: GuestResponse[]
  [key: string]: any
}

interface RsvpResponse {
  household: HouseholdResponse
  questions: Question[]
}

interface OptionsResponse {
  mealOptions: Option[]
  childMealOptions: Option[]
  dessertOptions: Option[]
  childDessertOptions: Option[]
}

export default function RSVPForm() {
  const params = useParams()
  const { toast } = useToast()
  const [household, setHousehold] = useState<{ name: string; guests: LocalGuest[] } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [mealOptions, setMealOptions] = useState<Option[]>([])
  const [childMealOptions, setChildMealOptions] = useState<Option[]>([])
  const [dessertOptions, setDessertOptions] = useState<Option[]>([])
  const [childDessertOptions, setChildDessertOptions] = useState<Option[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [householdResponse, optionsResponse] = await Promise.all([
          fetch(`/api/rsvp/${params.code}`),
          fetch('/api/rsvp/options')
        ])
        
        const householdData = await householdResponse.json() as RsvpResponse
        const optionsData = await optionsResponse.json() as OptionsResponse
        
        // Check if householdData has the expected structure
        if (!householdData.household || !Array.isArray(householdData.household.guests)) {
          throw new Error("Invalid response format from server");
        }
        
        // Log the raw household data to debug isChild values
        console.log("Raw household data received:", JSON.stringify(householdData.household.guests.map((g: GuestResponse) => ({
          id: g.id,
          name: g.name,
          isChild: g.isChild,
          isChildType: typeof g.isChild
        })), null, 2));
        
        // ENHANCED: Perform a stronger check to ensure isChild is processed correctly
        const processedGuests = householdData.household.guests.map((guest: GuestResponse): LocalGuest => {
          // Always use explicit boolean conversion to ensure consistent behavior
          const isChildValue = guest.isChild === true;
          
          console.log(`Guest ${guest.name} (${guest.id}):`);
          console.log(`- Raw isChild value: ${guest.isChild}, type: ${typeof guest.isChild}`);
          console.log(`- After strict equality: isChildValue = ${isChildValue}`);
          console.log(`- Meal choice options: Will use ${isChildValue ? 'CHILD' : 'ADULT'} options`);
          
          // Check if meal/dessert options are missing
          if (isChildValue && optionsData.childMealOptions.length === 0) {
            console.warn(`WARNING: Child guest ${guest.name} has no child meal options available!`);
          }
          if (isChildValue && optionsData.childDessertOptions.length === 0) {
            console.warn(`WARNING: Child guest ${guest.name} has no child dessert options available!`);
          }
          
          return {
            id: guest.id,
            name: guest.name,
            mealOptionId: guest.mealChoice || undefined,
            dessertOptionId: guest.dessertChoice || undefined,
            isChild: isChildValue
          };
        });
        
        // Log the processed guests for debugging
        console.log("Processed guests after strict equality check:", processedGuests.map(g => ({
          name: g.name,
          isChild: g.isChild,
          isChildType: typeof g.isChild
        })));
        
        setHousehold({
          name: householdData.household.name,
          guests: processedGuests
        });
        
        setQuestions(householdData.questions)
        
        // ENHANCED: Check if meal and dessert options are available
        if (optionsData.mealOptions.length === 0) {
          console.warn("WARNING: No regular meal options available!");
        }
        if (optionsData.childMealOptions.length === 0) {
          console.warn("WARNING: No child meal options available!");
        }
        if (optionsData.dessertOptions.length === 0) {
          console.warn("WARNING: No regular dessert options available!");
        }
        if (optionsData.childDessertOptions.length === 0) {
          console.warn("WARNING: No child dessert options available!");
        }
        
        console.log("Setting meal options:", {
          regular: optionsData.mealOptions.length,
          child: optionsData.childMealOptions.length,
          regularDessert: optionsData.dessertOptions.length,
          childDessert: optionsData.childDessertOptions.length
        });
        
        setMealOptions(optionsData.mealOptions)
        setChildMealOptions(optionsData.childMealOptions || [])
        setDessertOptions(optionsData.dessertOptions)
        setChildDessertOptions(optionsData.childDessertOptions || [])
      } catch (error) {
        console.error("Error fetching RSVP data:", error);
        toast({
          title: "Error",
          description: "Failed to load RSVP form",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [params.code, toast])

  // Debug effect to log state after it's been set
  useEffect(() => {
    if (household) {
      console.log("RSVP Component State - Guests with isChild status:");
      household.guests.forEach((guest: LocalGuest) => {
        console.log(`${guest.name}: isChild=${guest.isChild} (${typeof guest.isChild})`);
      });
    }
  }, [household]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields for attending guests
    const hasInvalidResponses = household?.guests.some((guest: LocalGuest) => {
      if (responses[`attending-${guest.id}`]) {
        if (!responses[`meal-${guest.id}`] || !responses[`dessert-${guest.id}`]) {
          return true
        }
      }
      return false
    })

    if (hasInvalidResponses) {
      toast({
        title: "Error",
        description: "Please select meal and dessert preferences for all attending guests",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/rsvp/${params.code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ responses }),
      })

      if (!response.ok) throw new Error("Failed to submit RSVP")

      toast({
        title: "Success",
        description: "Your RSVP has been submitted successfully",
      })
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to submit RSVP",
        variant: "destructive",
      })
    }
  }

  if (!household) return null

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-cormorant text-center">RSVP - {household.name}</CardTitle>
            <p className="text-center text-muted-foreground mt-2">Please respond by Sunday 22nd June</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {household.guests.map((guest) => (
                <div key={guest.id} className="space-y-4">
                  <h3 className="text-xl font-cormorant">{guest.name}</h3>
                  {/* Debug info - visible on page */}
                  <div className="bg-yellow-100 text-black p-2 text-xs rounded mb-2">
                    <p><strong>Debug info:</strong></p>
                    <p>isChild raw value: {String(guest.isChild)}</p>
                    <p>isChild type: {typeof guest.isChild}</p>
                    <p>isChild === true: {String(guest.isChild === true)}</p>
                    <p>Will use: {guest.isChild === true ? "Child options" : "Adult options"}</p>
                    <p>Available meal options: {guest.isChild === true ? childMealOptions.length : mealOptions.length}</p>
                    <p>Child meal options available: {childMealOptions.length}</p>
                    <p>Regular meal options available: {mealOptions.length}</p>
                    <hr className="my-1" />
                    <p>Available dessert options: {guest.isChild === true ? childDessertOptions.length : dessertOptions.length}</p>
                    <p>Child dessert options available: {childDessertOptions.length}</p>
                    <p>Regular dessert options available: {dessertOptions.length}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`attending-${guest.id}`}
                      checked={responses[`attending-${guest.id}`]}
                      onCheckedChange={(checked) =>
                        setResponses({
                          ...responses,
                          [`attending-${guest.id}`]: checked,
                        })
                      }
                    />
                    <label htmlFor={`attending-${guest.id}`}>Attending</label>
                  </div>
                    {responses[`attending-${guest.id}`] && (
                    <>
                      <div className="space-y-2">
                      <label>Meal Preference</label>
                      {(() => {
                        console.log(`Rendering meal options for ${guest.name}: isChild=${guest.isChild}`);
                        const isChildGuest = guest.isChild === true;
                        
                        // Log detailed info about available options
                        console.log(`Guest ${guest.name} is ${isChildGuest ? "a child" : "an adult"}`);
                        console.log(`Available options for ${guest.name}:`, {
                          type: isChildGuest ? "child" : "adult",
                          availableCount: isChildGuest ? childMealOptions.length : mealOptions.length,
                          allChildOptions: childMealOptions.map(o => o.name),
                          allRegularOptions: mealOptions.map(o => o.name)
                        });
                        
                        return null;
                      })()}
                      <Select
                        value={responses[`meal-${guest.id}`]}
                        onValueChange={(value) => {
                          console.log(`Selected meal for ${guest.name}: ${value}`);
                          setResponses({
                            ...responses,
                            [`meal-${guest.id}`]: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                        <SelectValue placeholder="Select a meal" />
                        </SelectTrigger>
                        <SelectContent>
                        {(() => {
                          // Use strict boolean comparison
                          const isChildGuest = guest.isChild === true;
                          const options = isChildGuest ? childMealOptions : mealOptions;
                          
                          // Check if we have options to display
                          if (options.length === 0) {
                            console.error(`No meal options available for ${guest.name} (${isChildGuest ? "child" : "adult"})`);
                            return <SelectItem value="no-options" disabled>No options available</SelectItem>;
                          }
                          
                          // Log what we're rendering
                          console.log(`Rendering ${options.length} meal options for ${guest.name}:`, 
                            options.map(o => o.name));
                          
                          // Return the mapped options
                          return options.map((option: Option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ));
                        })()}
                        </SelectContent>
                      </Select>
                      </div>
                      <div className="space-y-2">
                      <label>Dessert Choice</label>
                      {(() => {
                        console.log(`Rendering dessert options for ${guest.name}: isChild=${guest.isChild}`);
                        const isChildGuest = guest.isChild === true;
                        
                        // Log detailed info about available options
                        console.log(`Available dessert options for ${guest.name}:`, {
                          type: isChildGuest ? "child" : "adult",
                          availableCount: isChildGuest ? childDessertOptions.length : dessertOptions.length,
                          allChildOptions: childDessertOptions.map(o => o.name),
                          allRegularOptions: dessertOptions.map(o => o.name)
                        });
                        
                        return null;
                      })()}
                      <Select
                        value={responses[`dessert-${guest.id}`]}
                        onValueChange={(value) => {
                          console.log(`Selected dessert for ${guest.name}: ${value}`);
                          setResponses({
                            ...responses,
                            [`dessert-${guest.id}`]: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                        <SelectValue placeholder="Select a dessert" />
                        </SelectTrigger>
                        <SelectContent>
                        {(() => {
                          // Use strict boolean comparison
                          const isChildGuest = guest.isChild === true;
                          const options = isChildGuest ? childDessertOptions : dessertOptions;
                          
                          // Check if we have options to display
                          if (options.length === 0) {
                            console.error(`No dessert options available for ${guest.name} (${isChildGuest ? "child" : "adult"})`);
                            return <SelectItem value="no-options" disabled>No options available</SelectItem>;
                          }
                          
                          // Log what we're rendering
                          console.log(`Rendering ${options.length} dessert options for ${guest.name}:`, 
                            options.map(o => o.name));
                          
                          // Return the mapped options
                          return options.map((option: Option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ));
                        })()}
                        </SelectContent>
                      </Select>
                      </div>
                    </>
                    )}
                    {responses[`attending-${guest.id}`] &&
                    questions
                      .filter((q) => q.perGuest)
                      .map((question) => (
                        <div key={question.id} className="space-y-2">
                          <label>{question.question}</label>
                          {question.type === "MULTIPLE_CHOICE" ? (
                            <Select
                              value={responses[`${question.id}-${guest.id}`]}
                              onValueChange={(value) =>
                                setResponses({
                                  ...responses,
                                  [`${question.id}-${guest.id}`]: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  try {
                                    const parsedOptions = JSON.parse(question.options);
                                    return parsedOptions.map((option: string) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ));
                                  } catch {
                                    return null;
                                  }
                                })()}
                              </SelectContent>
                            </Select>
                          ) : question.type === "TEXT" ? (
                            <Input
                              value={responses[`${question.id}-${guest.id}`] || ""}
                              onChange={(e) =>
                                setResponses({
                                  ...responses,
                                  [`${question.id}-${guest.id}`]: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${question.id}-${guest.id}`}
                                checked={responses[`${question.id}-${guest.id}`]}
                                onCheckedChange={(checked) =>
                                  setResponses({
                                    ...responses,
                                    [`${question.id}-${guest.id}`]: checked,
                                  })
                                }
                              />
                              <label htmlFor={`${question.id}-${guest.id}`}>Yes</label>
                            </div>
                          )}
                        </div>
                      ))}
                </div>
              ))}
              {questions
                .filter((q) => !q.perGuest)
                .map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label>{question.question}</label>
                    {question.type === "MULTIPLE_CHOICE" ? (
                      <Select
                        value={responses[question.id]}
                        onValueChange={(value) =>
                          setResponses({
                            ...responses,
                            [question.id]: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {(() => {
                              try {
                                const parsedOptions = JSON.parse(question.options);
                                return parsedOptions.map((option: string) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ));
                              } catch {
                                return null;
                              }
                            })()}
                        </SelectContent>
                      </Select>
                    ) : question.type === "TEXT" ? (
                      <Input
                        value={responses[question.id] || ""}
                        onChange={(e) =>
                          setResponses({
                            ...responses,
                            [question.id]: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={question.id}
                          checked={responses[question.id]}
                          onCheckedChange={(checked) =>
                            setResponses({
                              ...responses,
                              [question.id]: checked,
                            })
                          }
                        />
                        <label htmlFor={question.id}>Yes</label>
                      </div>
                    )}
                  </div>
                ))}
              <Button type="submit" className="w-full">
                Submit RSVP
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

