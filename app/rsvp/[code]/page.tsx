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

interface Guest {
  id: string
  name: string
  isAttending?: boolean
  mealOptionId?: string
  dessertOptionId?: string
  isChild?: boolean
}

interface Option {
  id: string
  name: string
  isChildOption?: boolean
}

interface Question {
  id: string
  type: "TEXT" | "MULTIPLE_CHOICE" | "BOOLEAN" | "DATE"
  question: string
  options: string // This is a JSON string that needs to be parsed
  isRequired: boolean
  perGuest: boolean
  isActive: boolean
  order: number
}

const MotionDiv = motion.div

export default function RSVPForm() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [household, setHousehold] = useState<{ name: string; guests: Guest[] } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [mealOptions, setMealOptions] = useState<Option[]>([])
  const [childMealOptions, setChildMealOptions] = useState<Option[]>([])
  const [dessertOptions, setDessertOptions] = useState<Option[]>([])
  const [childDessertOptions, setChildDessertOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [householdResponse, optionsResponse] = await Promise.all([
          fetch(`/api/rsvp/${params.code}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }),
          fetch('/api/rsvp/options', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          })
        ])
        
        if (!householdResponse.ok) {
          throw new Error('Failed to fetch household data')
        }
        if (!optionsResponse.ok) {
          throw new Error('Failed to fetch menu options')
        }
        
        const householdData = await householdResponse.json()
        const optionsData = await optionsResponse.json()
        
        // Validate child options
        if (householdData.household.guests.some((g: Guest) => g.isChild) && 
            (!optionsData.childMealOptions?.length || !optionsData.childDessertOptions?.length)) {
          console.warn('Child guests present but child options missing')
          toast({
            title: "Warning",
            description: "Some menu options may not be available. Please contact the hosts.",
            variant: "destructive",
          })
        }

        // Normalize isChild property explicitly to ensure it's a true boolean
        const normalizedGuests = householdData.household.guests.map((guest: Guest) => {
          // Explicitly normalize isChild as boolean
          const isChildValue = 
            typeof guest.isChild === 'string' 
              ? (guest.isChild as string).toLowerCase() === 'true' 
              : Boolean(guest.isChild);
          
          console.log(`Normalizing guest ${guest.name}: isChild=${guest.isChild} (${typeof guest.isChild}) → ${isChildValue} (${typeof isChildValue})`);
          
          return {
            ...guest,
            isChild: isChildValue
          };
        });

        const normalizedHousehold = {
          ...householdData.household,
          guests: normalizedGuests
        };

        setHousehold(normalizedHousehold)
        setQuestions(householdData.questions)
        setMealOptions(optionsData.mealOptions || [])
        setChildMealOptions(optionsData.childMealOptions || [])
        setDessertOptions(optionsData.dessertOptions || [])
        setChildDessertOptions(optionsData.childDessertOptions || [])

        // Debug questions
        console.log('Loaded questions:', householdData.questions);

        // Set up initial responses based on existing data
        const initialResponses: Record<string, any> = {};
        
        // Initialize attendance, meal, and dessert choices
        normalizedGuests.forEach(guest => {
          // Pre-fill attendance status
          if (guest.isAttending !== undefined) {
            initialResponses[`attending-${guest.id}`] = guest.isAttending;
          }
          
          // Pre-fill meal choice
          if (guest.mealChoice) {
            initialResponses[`meal-${guest.id}`] = guest.mealChoice;
          }
          
          // Pre-fill dessert choice
          if (guest.dessertChoice) {
            initialResponses[`dessert-${guest.id}`] = guest.dessertChoice;
          }
          
          // Pre-fill dietary notes
          if (guest.dietaryNotes) {
            initialResponses[`dietary-${guest.id}`] = guest.dietaryNotes;
          }
          
          // Pre-fill guest-specific question responses
          if (guest.responses && Array.isArray(guest.responses)) {
            guest.responses.forEach((response: any) => {
              initialResponses[`${response.questionId}-${guest.id}`] = response.answer;
            });
          }
        });
        
        // Set initial responses
        setResponses(initialResponses);
        console.log('Initial responses set:', initialResponses);

      } catch (error) {
        console.error('Error fetching RSVP data:', error)
        setError('Failed to load RSVP form. Please try again later.')
        toast({
          title: "Error",
          description: "Failed to load RSVP form",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.code) {
      fetchData()
    }
  }, [params.code, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!household) return

    try {
      // Validate responses
      const errors: string[] = []
      
      household.guests.forEach(guest => {
        const isAttending = responses[`attending-${guest.id}`]
        if (isAttending === undefined) {
          errors.push(`Please indicate if ${guest.name} is attending`)
        }
        
        if (isAttending) {
          const mealChoice = responses[`meal-${guest.id}`]
          const dessertChoice = responses[`dessert-${guest.id}`]
          
          if (!mealChoice) {
            errors.push(`Please select a meal for ${guest.name}`)
          }
          if (!dessertChoice) {
            errors.push(`Please select a dessert for ${guest.name}`)
          }
          
          // Validate child options - normalize isChild to Boolean for consistency
          const isChild = Boolean(guest.isChild);
          if (isChild) {
            console.log(`Validating child options for ${guest.name} (isChild=${isChild})`);
            const selectedMeal = childMealOptions.find(o => o.id === mealChoice)
            const selectedDessert = childDessertOptions.find(o => o.id === dessertChoice)
            
            if (mealChoice && !selectedMeal) {
              errors.push(`Please select a children's meal for ${guest.name}`)
            }
            if (dessertChoice && !selectedDessert) {
              errors.push(`Please select a children's dessert for ${guest.name}`)
            }
          }
        }
      })

      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join('. '),
          variant: "destructive",
        })
        return
      }

      // Format the data for the API
      const formattedGuests = household.guests.map(guest => {
        const isAttending = responses[`attending-${guest.id}`] === true;
        const mealChoice = isAttending ? responses[`meal-${guest.id}`] : null;
        const dessertChoice = isAttending ? responses[`dessert-${guest.id}`] : null;
        const dietaryNotes = responses[`dietary-${guest.id}`] || null;
        
        // Collect question responses for this guest
        const guestResponses = questions
          .filter(q => q.perGuest)
          .map(question => ({
            questionId: question.id,
            answer: String(responses[`${question.id}-${guest.id}`] || '')
          }))
          .filter(r => r.answer.trim() !== ''); // Only include non-empty responses
        
        return {
          id: guest.id,
          name: guest.name,
          isAttending,
          mealChoice: isAttending ? mealChoice : null,
          dessertChoice: isAttending ? dessertChoice : null,
          dietaryNotes,
          isChild: guest.isChild,
          responses: guestResponses
        };
      });
      
      // Add household-level questions
      const householdResponses = questions
        .filter(q => !q.perGuest)
        .map(question => ({
          questionId: question.id,
          answer: String(responses[question.id] || '')
        }))
        .filter(r => r.answer.trim() !== '');
      
      const apiData = {
        guests: formattedGuests,
        householdResponses
      };
      
      console.log('Submitting RSVP data:', apiData);

      const response = await fetch(`/api/rsvp/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store',
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit RSVP');
      }

      toast({
        title: "Success",
        description: "Your RSVP has been submitted successfully",
      });
      
      // Redirect to success page or close modal
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit RSVP. Please try again.",
        variant: "destructive",
      });
    }
  }

  const getQuestionOptions = (question: Question): string[] => {
    if (question.type !== "MULTIPLE_CHOICE") return [];
    
    try {
      // Handle different potential formats for options
      if (!question.options) {
        console.warn(`Question ${question.id} has no options string`);
        return [];
      }
      
      if (typeof question.options === 'string') {
        // Try to parse as JSON string
        if (question.options.trim() === '') {
          console.warn(`Question ${question.id} has empty options string`);
          return [];
        }
        
        try {
          const parsed = JSON.parse(question.options);
          if (Array.isArray(parsed)) {
            return parsed;
          } else if (typeof parsed === 'object') {
            // Handle case where it might be an object with options
            return Object.values(parsed).map(v => String(v));
          } else {
            // Single option case
            return [String(parsed)];
          }
        } catch (e) {
          // If not valid JSON, treat as comma-separated list
          console.warn(`Failed to parse JSON for question ${question.id}, treating as comma-separated: ${e}`);
          return question.options.split(',').map(o => o.trim()).filter(o => o.length > 0);
        }
      } else if (Array.isArray(question.options)) {
        // Already an array
        return question.options.map(o => String(o));
      } else {
        console.warn(`Unexpected options format for question ${question.id}: ${typeof question.options}`);
        return [];
      }
    } catch (error) {
      console.error(`Error processing options for question ${question.id}:`, error);
      console.error(`Raw options data:`, question.options);
      return [];
    }
  }

  const onBack = () => {
    router.push('/')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!household) {
    return <div>No household found</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-cormorant text-center">RSVP - {household.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {household.guests.map((guest) => (
                <div key={guest.id} className="space-y-4">
                  <h3 className="text-xl font-cormorant">{guest.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`attending-${guest.id}`}
                      checked={responses[`attending-${guest.id}`]}
                      onCheckedChange={(checked) => {
                        setResponses({
                          ...responses,
                          [`attending-${guest.id}`]: checked
                        })
                      }}
                    />
                    <label htmlFor={`attending-${guest.id}`}>Will you be attending?</label>
                  </div>

                  {responses[`attending-${guest.id}`] && (
                    <>
                      <div className="space-y-2">
                        <label>Meal Choice</label>
                        <Select
                          value={responses[`meal-${guest.id}`]}
                          onValueChange={(value) => {
                            setResponses({
                              ...responses,
                              [`meal-${guest.id}`]: value
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a meal" />
                          </SelectTrigger>
                          <SelectContent>
                            {guest.isChild === true
                              ? childMealOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))
                              : mealOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label>Dessert Choice</label>
                        <Select
                          value={responses[`dessert-${guest.id}`]}
                          onValueChange={(value) => {
                            setResponses({
                              ...responses,
                              [`dessert-${guest.id}`]: value
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a dessert" />
                          </SelectTrigger>
                          <SelectContent>
                            {guest.isChild === true
                              ? childDessertOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))
                              : dessertOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label>Dietary Requirements</label>
                        <Input
                          value={responses[`dietary-${guest.id}`] || ""}
                          onChange={(e) => {
                            setResponses({
                              ...responses,
                              [`dietary-${guest.id}`]: e.target.value
                            })
                          }}
                          placeholder="Any dietary requirements or allergies?"
                        />
                      </div>
                    </>
                  )}

                  {questions
                    .filter((q) => q.perGuest)
                    .map((question) => (
                      <div key={question.id} className="space-y-2">
                        <label>{question.question}</label>
                        {question.type === "MULTIPLE_CHOICE" ? (
                          <Select
                            value={responses[`${question.id}-${guest.id}`]}
                            onValueChange={(value) => {
                              setResponses({
                                ...responses,
                                [`${question.id}-${guest.id}`]: value
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {getQuestionOptions(question).map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : question.type === "BOOLEAN" ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${question.id}-${guest.id}`}
                              checked={responses[`${question.id}-${guest.id}`]}
                              onCheckedChange={(checked) => {
                                setResponses({
                                  ...responses,
                                  [`${question.id}-${guest.id}`]: checked
                                })
                              }}
                            />
                            <label htmlFor={`${question.id}-${guest.id}`}>Yes</label>
                          </div>
                        ) : (
                          <Input
                            value={responses[`${question.id}-${guest.id}`] || ""}
                            onChange={(e) => {
                              setResponses({
                                ...responses,
                                [`${question.id}-${guest.id}`]: e.target.value
                              })
                            }}
                            placeholder="Your answer"
                          />
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
                        onValueChange={(value) => {
                          setResponses({
                            ...responses,
                            [question.id]: value
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {getQuestionOptions(question).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : question.type === "BOOLEAN" ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={question.id}
                          checked={responses[question.id]}
                          onCheckedChange={(checked) => {
                            setResponses({
                              ...responses,
                              [question.id]: checked
                            })
                          }}
                        />
                        <label htmlFor={question.id}>Yes</label>
                      </div>
                    ) : (
                      <Input
                        value={responses[question.id] || ""}
                        onChange={(e) => {
                          setResponses({
                            ...responses,
                            [question.id]: e.target.value
                          })
                        }}
                        placeholder="Your answer"
                      />
                    )}
                  </div>
                ))}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit">Submit RSVP</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </MotionDiv>
    </div>
  )
}