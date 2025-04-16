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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [householdResponse, optionsResponse] = await Promise.all([
          fetch(`/api/rsvp/${params.code}`),
          fetch('/api/rsvp/options')
        ])
        
        const householdData = await householdResponse.json()
        const optionsData = await optionsResponse.json()
        
        setHousehold(householdData.household)
        setQuestions(householdData.questions)
        setMealOptions(optionsData.mealOptions)
        setChildMealOptions(optionsData.childMealOptions || [])
        setDessertOptions(optionsData.dessertOptions)
        setChildDessertOptions(optionsData.childDessertOptions || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load RSVP form",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [params.code, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields for attending guests
    const hasInvalidResponses = household?.guests.some(guest => {
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
                      <Select
                        value={responses[`meal-${guest.id}`]}
                        onValueChange={(value) =>
                        setResponses({
                          ...responses,
                          [`meal-${guest.id}`]: value,
                        })
                        }
                      >
                        <SelectTrigger>
                        <SelectValue placeholder="Select a meal" />
                        </SelectTrigger>
                        <SelectContent>
                        {(guest.isChild ? childMealOptions : mealOptions).map((option) => (
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
                        onValueChange={(value) =>
                        setResponses({
                          ...responses,
                          [`dessert-${guest.id}`]: value,
                        })
                        }
                      >
                        <SelectTrigger>
                        <SelectValue placeholder="Select a dessert" />
                        </SelectTrigger>
                        <SelectContent>
                        {(guest.isChild ? childDessertOptions : dessertOptions).map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                          {option.name}
                          </SelectItem>
                        ))}
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

