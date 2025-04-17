"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
// Motion components
const MotionDiv = motion.div

interface Question {
  id: string
  question: string
  type: "TEXT" | "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "BOOLEAN" | "DATE"
  options: string
  isRequired: boolean
  perGuest: boolean
  isActive: boolean
  order: number
}


interface Response {
  questionId: string
  answer: string
}

interface Guest {
  id: string
  name: string
  isAttending: boolean | null
  mealChoice: {
    id: string
    name: string
  } | null
  dessertChoice: {
    id: string
    name: string
  } | null
  dietaryNotes: string | null
  responses: Response[]
  isChild: boolean
}

interface GuestFormProps {

  household: {
    name: string
    code: string
    guests: Guest[]
    questions?: Question[]
  }
  onBack: () => void
  onSuccess: (guests: Guest[]) => void
}

export default function GuestForm({ household, onBack, onSuccess }: GuestFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mealOptions, setMealOptions] = useState<{ id: string; name: string }[]>([])
  const [childMealOptions, setChildMealOptions] = useState<{ id: string; name: string }[]>([])
  const [dessertOptions, setDessertOptions] = useState<{ id: string; name: string }[]>([])
  const [childDessertOptions, setChildDessertOptions] = useState<{ id: string; name: string }[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  
  // Add explicit boolean conversion for all guests' isChild property
  const [guests, setGuests] = useState<Guest[]>(() => {
    // Debug the raw values coming from the household object
    console.log('RAW GUEST DATA:', JSON.stringify(household.guests, null, 2));
    
    // Log exact values to debug isChild
    household.guests.forEach(guest => {
      console.log(`Guest ${guest.name} rawIsChild:`, {
        value: guest.isChild,
        type: typeof guest.isChild, 
        stringified: JSON.stringify(guest.isChild),
        booleanConversion: !!guest.isChild,
      });
    });
    
    return household.guests.map(guest => {
      // Safely convert isChild to boolean regardless of input type
      const isChildValue = (() => {
        if (typeof guest.isChild === 'string') {
          return guest.isChild === 'true' || guest.isChild === 'TRUE';
        }
        return Boolean(guest.isChild);
      })();
      
      return {
        ...guest,
        // Use the properly processed boolean value
        isChild: isChildValue,
        mealChoice: guest.mealChoice || null,
        dessertChoice: guest.dessertChoice || null,
        responses: guest.responses || [],
        isAttending: guest.isAttending ?? null
      };
    });
  });
  
  console.log('GUEST DATA AFTER TRANSFORMATION:');
  console.log('isChild after conversion:', guests.map(g => ({ name: g.name, isChild: g.isChild })));
  console.log(`Found ${guests.filter(g => g.isChild).length} child guests in household`);

  // Add handleBack function
  const handleBack = () => {
    // Clear any stored form data
    localStorage.removeItem(`rsvp-${household.code}`);
    // Call the onBack prop to return to search
    onBack();
  };

  const [questions, setQuestions] = useState<Question[]>(() => {
    return household.questions || [];
  });

  // Define fetchData function before using it
  const fetchData = async () => {
    try {
      const optionsResponse = await fetch('/api/rsvp/form-data')
      const optionsData = await optionsResponse.json()
      
      console.log('API Response data:', optionsData);
      console.log('Child meal options from API:', optionsData.childMealOptions);
      console.log('Child dessert options from API:', optionsData.childDessertOptions);
      
      if (!optionsResponse.ok) {
        throw new Error(optionsData.error || 'Failed to fetch options')
      }
      
      // Regular options handling
      if (optionsData.mealOptions?.length > 0) {
        setMealOptions(optionsData.mealOptions)
      }
      
      // Child options handling with fallback
      if (optionsData.childMealOptions?.length > 0) {
        setChildMealOptions(optionsData.childMealOptions)
      } else {
        // If no child options, use regular options as fallback
        console.warn('No child meal options found, using regular options as fallback')
        setChildMealOptions(optionsData.mealOptions || [])
      }
      
      // Regular dessert options
      if (optionsData.dessertOptions?.length > 0) {
        setDessertOptions(optionsData.dessertOptions)
      }
      
      // Child dessert options with fallback
      if (optionsData.childDessertOptions?.length > 0) {
        setChildDessertOptions(optionsData.childDessertOptions)
      } else {
        // If no child options, use regular options as fallback
        console.warn('No child dessert options found, using regular options as fallback')
        setChildDessertOptions(optionsData.dessertOptions || [])
      }
      
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load form data"
      })
    }
  }

  // Add effect to update state when household changes
  useEffect(() => {
    // Reset form state when household changes
    const newGuests = household.guests.map(guest => ({
      ...guest,
      mealChoice: guest.mealChoice || null,
      dessertChoice: guest.dessertChoice || null,
      responses: guest.responses || [],
      isAttending: guest.isAttending ?? null
    }));
    
    setGuests(newGuests);
    
    if (household.questions) {
      setQuestions(household.questions);
    }

    // Clear validation errors when household changes
    setValidationErrors({});

    // Only clear stored data if we're not modifying
    const isModifying = localStorage.getItem('modifying-rsvp') === 'true';
    if (!isModifying) {
      const storageKey = `rsvp-${household.code}`;
      localStorage.removeItem(storageKey);
    }

    // Fetch form data if we're modifying
    if (isModifying) {
      fetchData();
    }
  }, [household]);

  // Add effect to save state on unload

  useEffect(() => {
    const handleBeforeUnload = () => {
      const storageKey = `rsvp-${household.code}`;
      localStorage.setItem(storageKey, JSON.stringify({ 
        guests,
        questions 
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [household.code, guests, questions]);

  useEffect(() => {
    fetchData()
    
    // Log children when component mounts
    console.log('Guest isChild values on component mount:', guests.map(g => ({ 
      name: g.name, 
      isChild: g.isChild 
    })))
  }, [])






  // Add effect to fetch questions if not available
  useEffect(() => {
    const fetchQuestions = async () => {
      if (questions.length === 0) {
        try {
          const questionsResponse = await fetch('/api/rsvp/questions');
          const questionsData = await questionsResponse.json();
          
          if (questionsResponse.ok && questionsData.questions?.length > 0) {
            setQuestions(questionsData.questions);
            // Update localStorage with new questions
            const storageKey = `rsvp-${household.code}`;
            const savedData = localStorage.getItem(storageKey);
            const currentData = savedData ? JSON.parse(savedData) : {};
            localStorage.setItem(storageKey, JSON.stringify({
              ...currentData,
              questions: questionsData.questions
            }));
          }
        } catch (error) {
          console.error('Failed to fetch questions:', error);
        }
      }
    };

    fetchQuestions();
  }, [questions.length, household.code]);

  // Add debug logging to the render section
  console.log('Rendering GuestForm with:', {
    mealOptions,
    childMealOptions,
    dessertOptions,
    childDessertOptions,
    questions,
    guests
  })

  const saveToLocalStorage = (updatedGuests: Guest[]) => {
    const storageKey = `rsvp-${household.code}`;
    localStorage.setItem(storageKey, JSON.stringify({ 
      guests: updatedGuests,
      questions,
      code: household.code
    }));
  };

  const clearFieldError = (guestId: string, errorText: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[guestId]) {
        newErrors[guestId] = newErrors[guestId].filter(err => !err.includes(errorText));
        if (newErrors[guestId].length === 0) delete newErrors[guestId];
      }
      return newErrors;
    });
  };

  const handleAttendanceChange = (guestId: string, attending: boolean) => {
    if (!attending) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[guestId];
        return newErrors;
      });
    }
    setGuests(prev => {
      const updated = prev.map(guest => 
        guest.id === guestId ? { 
          ...guest, 
          isAttending: attending,
          // Clear choices if not attending
          mealChoice: attending ? guest.mealChoice : null,
          dessertChoice: attending ? guest.dessertChoice : null,
          dietaryNotes: attending ? guest.dietaryNotes : null,
          responses: attending ? guest.responses : []
        } : guest
      );
      saveToLocalStorage(updated);
      return updated;
    });
  };

  const handleMealChoice = (guestId: string, meal: string) => {
    setGuests(prevGuests => {
      return prevGuests.map(g => {
        if (g.id === guestId) {
          // Find the meal option from the appropriate list based on isChild
          const isChildGuest = Boolean(g.isChild);
          const availableOptions = isChildGuest ? childMealOptions : mealOptions;
          const selectedMeal = availableOptions.find(m => m.id === meal);
          
          console.log('Meal choice for guest:', {
            guestId,
            guestName: g.name,
            isChild: isChildGuest,
            selectedMeal,
            availableOptions
          });

          return {
            ...g,
            mealChoice: selectedMeal || null
          };
        }
        return g;
      });
    });
  };

  const handleDessertChoice = (guestId: string, dessert: string) => {
    setGuests(prevGuests => {
      return prevGuests.map(g => {
        if (g.id === guestId) {
          // Find the dessert option from the appropriate list based on isChild
          const isChildGuest = Boolean(g.isChild);
          const availableOptions = isChildGuest ? childDessertOptions : dessertOptions;
          const selectedDessert = availableOptions.find(d => d.id === dessert);
          
          console.log('Dessert choice for guest:', {
            guestId,
            guestName: g.name,
            isChild: isChildGuest,
            selectedDessert,
            availableOptions
          });

          return {
            ...g,
            dessertChoice: selectedDessert || null
          };
        }
        return g;
      });
    });
  };

  const handleDietaryNotes = (guestId: string, notes: string) => {
    setGuests(prev => {
      const updated = prev.map(guest =>
        guest.id === guestId ? { ...guest, dietaryNotes: notes } : guest
      );
      saveToLocalStorage(updated);
      return updated;
    });
  };

  const handleQuestionResponse = (guestId: string, questionId: string, answer: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) clearFieldError(guestId, question.question);
    setGuests(prev => {
      const updated = prev.map(guest => {
        if (guest.id !== guestId) return guest;
        
        const responses = [...(guest.responses || [])];
        const existingIndex = responses.findIndex(r => r.questionId === questionId);
        
        if (existingIndex >= 0) {
          responses[existingIndex] = { questionId, answer };
        } else {
          responses.push({ questionId, answer });
        }
        
        return { ...guest, responses };
      });
      
      saveToLocalStorage(updated);
      return updated;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if any guest has toggled their attendance status
    const hasToggledAttendance = guests.some(guest => guest.isAttending !== null);
    if (!hasToggledAttendance) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Missing Response",
        description: "Please indicate attendance status for at least one guest.",
      });
      return;
    }

    // Validation logic for attending guests
    const errors: Record<string, string[]> = {};
    guests.forEach(guest => {
      if (guest.isAttending) {
        const guestErrors: string[] = [];
        if (!guest.mealChoice) {
          guestErrors.push('Meal choice is required');
        }
        if (!guest.dessertChoice) {
          guestErrors.push('Dessert choice is required');
        }
        questions.forEach(q => {
          if (q.isRequired) {
            const response = guest.responses?.find(r => r.questionId === q.id)?.answer;
            if (!response || response.trim() === '') {
              guestErrors.push(`${q.question} is required`);
            }
          }
        });
        if (guestErrors.length > 0) {
          errors[guest.id] = guestErrors;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please fill in all required fields for attending guests.",
      });
      return;
    }

    try {
      // Ensure all guests have a properly normalized isChild property before submission
      const normalizedGuests = guests.map(guest => ({
        ...guest,
        // Force boolean conversion of isChild 
        isChild: (() => {
          if (typeof guest.isChild === 'string') {
            return guest.isChild === 'true' || guest.isChild === 'TRUE';
          }
          return Boolean(guest.isChild);
        })()
      }));
      
      // Add detailed logging before submission
      console.log("About to submit RSVP with normalized guests:", JSON.stringify(normalizedGuests.map(g => ({
        id: g.id,
        name: g.name,
        isAttending: g.isAttending,
        mealChoice: g.mealChoice,
        dessertChoice: g.dessertChoice,
        isChild: g.isChild,
        typeOfIsChild: typeof g.isChild
      })), null, 2));
      
      const response = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: normalizedGuests }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit RSVP");
      }

      // Clear stored data
      localStorage.removeItem(`rsvp-${household.code}`);
      
      toast({
        title: "Success!",
        description: "Your RSVP has been submitted successfully.",
      });

      // Call onSuccess with the guests data
      onSuccess(guests);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit RSVP",
      });
    } finally {
      setLoading(false);
    }
  };


  // Add debug logging before render
  console.log('Rendering select options:', {
    mealOptions,
    childMealOptions,
    dessertOptions,
    childDessertOptions,
    guestMealChoices: guests.map(g => ({ id: g.id, mealChoice: g.mealChoice })),
    guestDessertChoices: guests.map(g => ({ id: g.id, dessertChoice: g.dessertChoice }))
  })

  return (
    <MotionDiv

      className="max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
        <div className="bg-black/30 p-8 rounded-lg border border-white/20">
        <Button

            variant="ghost"
            onClick={handleBack}
            className="mb-6 text-white hover:bg-white hover:bg-opacity-10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Search
        </Button>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">{household.name}</h2>
          <p className="text-gray-400">Please respond for each guest below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {guests.map((guest) => {
            const isChildGuest = Boolean(guest.isChild);
            const availableMealOptions = isChildGuest ? childMealOptions : mealOptions;
            const availableDessertOptions = isChildGuest ? childDessertOptions : dessertOptions;

            console.log('Rendering options for guest:', {
              name: guest.name,
              isChild: isChildGuest,
              mealOptions: availableMealOptions.length,
              dessertOptions: availableDessertOptions.length
            });

            return (
              <MotionDiv
                key={guest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-6 space-y-4"
              >
                <h3 className="text-xl font-semibold">{guest.name}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Will you be attending?</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(guest.id, true)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          guest.isAttending === true
                            ? 'bg-gold text-black'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(guest.id, false)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          guest.isAttending === false
                            ? 'bg-gold text-black'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {guest.isAttending && (
                    <>
                      {availableMealOptions.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Meal Choice
                          </label>
                          <select
                            value={guest.mealChoice?.id || ''}
                            onChange={(e) => handleMealChoice(guest.id, e.target.value)}
                            className="w-full bg-white/10 rounded-lg px-4 py-2 text-white"
                          >
                            <option value="">Select a meal</option>
                            {availableMealOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {availableDessertOptions.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Dessert Choice
                          </label>
                          <select
                            value={guest.dessertChoice?.id || ''}
                            onChange={(e) => handleDessertChoice(guest.id, e.target.value)}
                            className="w-full bg-white/10 rounded-lg px-4 py-2 text-white"
                          >
                            <option value="">Select a dessert</option>
                            {availableDessertOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Dietary Requirements
                        </label>
                        <textarea
                          value={guest.dietaryNotes || ''}
                          onChange={(e) => handleDietaryNotes(guest.id, e.target.value)}
                          className="w-full bg-white/10 rounded-lg px-4 py-2 text-white"
                          rows={3}
                          placeholder="Any allergies or dietary requirements?"
                        />
                      </div>
                    </>
                  )}
                </div>
              </MotionDiv>
            );
          })}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="w-32 px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit RSVP"}
            </button>
          </div>
        </form>
        </div>
    </MotionDiv>
  )
}