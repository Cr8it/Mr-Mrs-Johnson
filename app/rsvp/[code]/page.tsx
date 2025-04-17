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
  options: string
  isRequired: boolean
  perGuest: boolean
  isActive: boolean
  order: number
}

const MotionDiv = motion.div

export default function RSVPForm() {
  const params = useParams()
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
          fetch(`/api/rsvp/${params.code}`),
          fetch('/api/rsvp/options')
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

        setHousehold(householdData.household)
        setQuestions(householdData.questions)
        setMealOptions(optionsData.mealOptions || [])
        setChildMealOptions(optionsData.childMealOptions || [])
        setDessertOptions(optionsData.dessertOptions || [])
        setChildDessertOptions(optionsData.childDessertOptions || [])

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
          
          // Validate child options
          if (guest.isChild) {
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

      const response = await fetch(`/api/rsvp/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit RSVP')
      }

      toast({
        title: "Success",
        description: "Your RSVP has been submitted successfully",
      })

    } catch (error) {
      console.error('Error submitting RSVP:', error)
      toast({
        title: "Error",
        description: "Failed to submit RSVP. Please try again.",
        variant: "destructive",
      })
    }
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
                            {guest.isChild
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
                            {guest.isChild
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
                              {question.options.map((option: string) => (
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
                          {question.options.map((option: string) => (
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