"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Question, Option } from "@/components/types"
import ChildOptionsDebug from "@/components/ChildOptionsDebug"

// Local interface since this file uses different property names
interface LocalGuest {
  id: string
  name: string
  isAttending?: boolean
  mealOptionId?: string
  dessertOptionId?: string
  isChild: boolean // Changed to non-optional for clarity
}

// Define types for API responses
interface GuestResponse {
  id: string
  name: string
  isChild: boolean // Changed to non-optional
  mealChoice?: string | null
  dessertChoice?: string | null
  isAttending?: boolean | null
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

export default function RSVPForm({ params }: { params: { code: string | string[] } }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [household, setHousehold] = useState<HouseholdResponse | null>(null)
  const [mealOptions, setMealOptions] = useState<Option[]>([])
  const [childMealOptions, setChildMealOptions] = useState<Option[]>([])
  const [dessertOptions, setDessertOptions] = useState<Option[]>([])
  const [childDessertOptions, setChildDessertOptions] = useState<Option[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [questionsData, setQuestionsData] = useState<Question[]>([])
  const [hasLoadedOptions, setHasLoadedOptions] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  // Debug logger function
  const logDebugInfo = (message: string, data: any) => {
    console.log(`[RSVP Debug] ${message}:`, data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        logDebugInfo('Fetching RSVP form data for code', params.code);
        const codeParam = typeof params.code === 'string' ? params.code : params.code[0];
        
        const [householdResponse, optionsResponse] = await Promise.all([
          fetch(`/api/rsvp/${codeParam}`),
          fetch('/api/rsvp/options')
        ])
        
        if (!householdResponse.ok) {
          throw new Error(`Failed to fetch household data: ${householdResponse.statusText}`);
        }
        
        if (!optionsResponse.ok) {
          throw new Error(`Failed to fetch options data: ${optionsResponse.statusText}`);
        }
        
        const householdData = await householdResponse.json() as RsvpResponse;
        const optionsData = await optionsResponse.json() as OptionsResponse;
        
        // Check if householdData has the expected structure
        if (!householdData.household || !Array.isArray(householdData.household.guests)) {
          throw new Error("Invalid response format from server");
        }
        
        // Log all the options data for debugging
        logDebugInfo("Options data received", {
          regularMealOptions: optionsData.mealOptions?.length || 0,
          childMealOptions: optionsData.childMealOptions?.length || 0,
          regularDessertOptions: optionsData.dessertOptions?.length || 0,
          childDessertOptions: optionsData.childDessertOptions?.length || 0
        });
        
        // Ensure options are arrays even if empty
        const safeMealOptions = optionsData.mealOptions || [];
        const safeChildMealOptions = optionsData.childMealOptions || [];
        const safeDessertOptions = optionsData.dessertOptions || [];
        const safeChildDessertOptions = optionsData.childDessertOptions || [];
        
        // Log the guest data received from the server for debugging
        logDebugInfo("Raw household data received", 
          householdData.household.guests.map((g: GuestResponse) => ({
            id: g.id,
            name: g.name,
            isChild: g.isChild,
            isChildType: typeof g.isChild,
            mealChoice: g.mealChoice,
            dessertChoice: g.dessertChoice,
            isAttending: g.isAttending
          }))
        );
        
        // Set options first to ensure they're available
        setMealOptions(safeMealOptions);
        setChildMealOptions(safeChildMealOptions);
        setDessertOptions(safeDessertOptions);
        setChildDessertOptions(safeChildDessertOptions);
        
        // Mark options as loaded
        setHasLoadedOptions(true);
        
        // Set household data and questions
        setHousehold(householdData.household);
        setQuestionsData(householdData.questions || []);
        
        // Initialize responses with existing data
        const initialResponses: Record<string, any> = {};
        
        // Set initial response values based on existing data for each guest
        householdData.household.guests.forEach((guest: GuestResponse) => {
          // Default to false if undefined
          const attending = guest.isAttending === true;
          
          // Set attendance status
          initialResponses[`attending-${guest.id}`] = attending;
          
          // If the guest already has meal/dessert choices, or if we're showing
          // meal options regardless of attendance, initialize them
          if (guest.mealChoice) {
            initialResponses[`meal-${guest.id}`] = guest.mealChoice;
          }
          
          if (guest.dessertChoice) {
            initialResponses[`dessert-${guest.id}`] = guest.dessertChoice;
          }
          
          logDebugInfo(`Initialized responses for ${guest.name}`, {
            isChild: guest.isChild,
            attending: attending,
            mealChoice: guest.mealChoice,
            dessertChoice: guest.dessertChoice
          });
        });
        
        // Set the initial responses
        setResponses(initialResponses);
        
        logDebugInfo("Successfully loaded all RSVP form data", {
          household: householdData.household.name,
          guestCount: householdData.household.guests.length,
          hasChildGuests: householdData.household.guests.some((g: GuestResponse) => g.isChild === true)
        });
      } catch (error) {
        console.error("Error fetching RSVP data:", error);
        setError(error instanceof Error ? error.message : "Failed to load RSVP form");
        toast({
          title: "Error",
          description: "Failed to load RSVP form",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [params.code, toast])

  // Debug effect to log changes in child options
  useEffect(() => {
    if (hasLoadedOptions) {
      logDebugInfo("Child options loaded", {
        childMealOptions: childMealOptions.map(o => o.name),
        childDessertOptions: childDessertOptions.map(o => o.name),
      });
    }
  }, [hasLoadedOptions, childMealOptions, childDessertOptions]);

  // Debug effect to log household state after it's been set
  useEffect(() => {
    if (household) {
      logDebugInfo("RSVP Component State - Guests with isChild status", 
        household.guests.map(guest => ({
          name: guest.name,
          isChild: guest.isChild,
          type: typeof guest.isChild
        }))
      );
    }
  }, [household]);

  // Debug effect to log responses when they change
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      logDebugInfo("Current responses", responses);
    }
  }, [responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true);

    // Validate required fields for attending guests
    const hasInvalidResponses = household?.guests.some((guest: GuestResponse) => {
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
      setIsSubmitting(false);
      return
    }

    try {
      const codeParam = typeof params.code === 'string' ? params.code : params.code[0];
      const response = await fetch(`/api/rsvp/${codeParam}`, {
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
      setSuccessMessage("Your RSVP has been successfully submitted. Thank you!");
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to submit RSVP",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  // Add a debug component to help visualize available options and what's being shown to each guest
  const ChildOptionsDebug = ({ 
    guests, 
    mealOptions, 
    childMealOptions, 
    dessertOptions, 
    childDessertOptions 
  }: { 
    guests: LocalGuest[], 
    mealOptions: Option[], 
    childMealOptions: Option[], 
    dessertOptions: Option[], 
    childDessertOptions: Option[] 
  }) => {
    return (
      <div className="bg-gray-100 p-4 mb-8 rounded-lg text-xs">
        <h3 className="font-bold mb-2">Debug: Meal &amp; Dessert Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Adult Meal Options ({mealOptions.length})</h4>
            <ul className="list-disc pl-4">
              {mealOptions.map(o => <li key={o.id}>{o.name}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Child Meal Options ({childMealOptions.length})</h4>
            <ul className="list-disc pl-4">
              {childMealOptions.map(o => <li key={o.id}>{o.name}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Adult Dessert Options ({dessertOptions.length})</h4>
            <ul className="list-disc pl-4">
              {dessertOptions.map(o => <li key={o.id}>{o.name}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Child Dessert Options ({childDessertOptions.length})</h4>
            <ul className="list-disc pl-4">
              {childDessertOptions.map(o => <li key={o.id}>{o.name}</li>)}
            </ul>
          </div>
        </div>
        
        <h4 className="font-semibold mt-4 mb-2">Guest Options</h4>
        <div className="space-y-2">
          {guests.map(guest => (
            <div key={guest.id} className="border border-gray-300 p-2 rounded">
              <p>
                <strong>{guest.name}</strong> - {guest.isChild ? "Child" : "Adult"}
              </p>
              <p>
                Meal options shown: {guest.isChild ? childMealOptions.length : mealOptions.length} options
                ({guest.isChild ? "Child Menu" : "Adult Menu"})
              </p>
              <p>
                Dessert options shown: {guest.isChild ? childDessertOptions.length : dessertOptions.length} options
                ({guest.isChild ? "Child Menu" : "Adult Menu"})
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to render meal options based on whether guest is a child
  const renderMealOptions = (
    guest: LocalGuest,
    mealOptions: Option[],
    childMealOptions: Option[],
  ) => {
    const options = guest.isChild ? childMealOptions : mealOptions;
    const menuType = guest.isChild ? "Child Menu" : "Adult Menu";
    
    console.log(`Rendering meal options for ${guest.name} (isChild: ${guest.isChild}):`, 
      { availableOptions: options.map(o => o.name) });
    
    if (options.length === 0) {
      console.warn(`No meal options available for ${guest.name} (isChild: ${guest.isChild})`);
      return <p className="text-red-500">No meal options available</p>;
    }
    
    return (
      <>
        <p className="text-sm text-gray-500 mb-1">{menuType}</p>
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={guest.mealOptionId || ""}
          onChange={(e) => {
            const updatedGuests = [...household!.guests];
            const index = updatedGuests.findIndex((g) => g.id === guest.id);
            updatedGuests[index] = {
              ...updatedGuests[index],
              mealOptionId: e.target.value,
            };
            setHousehold({
              ...household!,
              guests: updatedGuests,
            });
          }}
          required={guest.isAttending}
        >
          <option value="">Select meal choice</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} {guest.isChild ? "(Child Option)" : ""}
            </option>
          ))}
        </select>
      </>
    );
  };

  // Helper function to render dessert options based on whether guest is a child
  const renderDessertOptions = (
    guest: LocalGuest,
    dessertOptions: Option[],
    childDessertOptions: Option[],
  ) => {
    const options = guest.isChild ? childDessertOptions : dessertOptions;
    const menuType = guest.isChild ? "Child Menu" : "Adult Menu";
    
    console.log(`Rendering dessert options for ${guest.name} (isChild: ${guest.isChild}):`, 
      { availableOptions: options.map(o => o.name) });
    
    if (options.length === 0) {
      console.warn(`No dessert options available for ${guest.name} (isChild: ${guest.isChild})`);
      return <p className="text-red-500">No dessert options available</p>;
    }
    
    return (
      <>
        <p className="text-sm text-gray-500 mb-1">{menuType}</p>
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={guest.dessertOptionId || ""}
          onChange={(e) => {
            const updatedGuests = [...household!.guests];
            const index = updatedGuests.findIndex((g) => g.id === guest.id);
            updatedGuests[index] = {
              ...updatedGuests[index],
              dessertOptionId: e.target.value,
            };
            setHousehold({
              ...household!,
              guests: updatedGuests,
            });
          }}
          required={guest.isAttending}
        >
          <option value="">Select dessert choice</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} {guest.isChild ? "(Child Option)" : ""}
            </option>
          ))}
        </select>
      </>
    );
  };

  if (!household) {
    if (error) {
      return (
        <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-500 mb-4">Error Loading RSVP Form</h3>
                <p className="mb-4">{error}</p>
                <Button onClick={() => router.push('/')} className="mt-4">
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Loading RSVP Form...</h3>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <ChildOptionsDebug 
          guests={household.guests}
          mealOptions={mealOptions}
          childMealOptions={childMealOptions}
          dessertOptions={dessertOptions}
          childDessertOptions={childDessertOptions}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-cormorant text-center">RSVP - {household.name}</CardTitle>
            <p className="text-center text-muted-foreground mt-2">Please respond by Sunday 22nd June</p>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <div className="text-center p-6">
                <h3 className="text-2xl font-bold text-green-500 mb-4">{successMessage}</h3>
                <p className="mb-6">We look forward to celebrating with you!</p>
                <Button onClick={() => router.push('/')} className="mt-4">
                  Return to Home
                </Button>
              </div>
            ) : (
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
                        checked={responses[`attending-${guest.id}`] || false}
                        onCheckedChange={(checked) =>
                          setResponses({
                            ...responses,
                            [`attending-${guest.id}`]: checked,
                          })
                        }
                      />
                      <label htmlFor={`attending-${guest.id}`}>Attending</label>
                    </div>
                    {/* Always show meal and dessert options, but disable them if not attending */}
                    <div className={responses[`attending-${guest.id}`] === false ? "opacity-50 pointer-events-none" : ""}>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold mb-1">
                            Meal Preference
                          </label>
                          
                          {renderMealOptions(guest, mealOptions, childMealOptions)}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold mb-1">
                            Dessert Preference
                          </label>
                          
                          {renderDessertOptions(guest, dessertOptions, childDessertOptions)}
                        </div>
                      </div>
                    </div>
                    
                    {responses[`attending-${guest.id}`] &&
                    questionsData
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
                {questionsData
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit RSVP"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

