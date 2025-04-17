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
    console.log('RAW isChild values:', household.guests.map(g => ({ name: g.name, isChild: g.isChild, rawValue: g.isChild })));
    
    return household.guests.map(guest => ({
      ...guest,
      // Force isChild to be a proper boolean with double negation
      isChild: !!guest.isChild,
      mealChoice: guest.mealChoice || null,
      dessertChoice: guest.dessertChoice || null,
      responses: guest.responses || [],
      isAttending: guest.isAttending ?? null
    }));
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
    clearFieldError(guestId, 'Meal choice');
    setGuests(prev => {
      const updated = prev.map(guest => {
        if (guest.id !== guestId) return guest;
        
        // Get the appropriate options based on whether guest is a child
        const isChildGuest = !!guest.isChild; // Force boolean conversion
        const relevantOptions = isChildGuest ? childMealOptions : mealOptions;
        const selectedOption = relevantOptions.find(opt => opt.id === meal);
        
        return { 
          ...guest, 
          mealChoice: { 
            id: meal,
            name: selectedOption?.name || 'Unknown Option'
          } 
        };
      });
      saveToLocalStorage(updated);
      return updated;
    });
  };

  const handleDessertChoice = (guestId: string, dessert: string) => {
    clearFieldError(guestId, 'Dessert choice');
    setGuests(prev => {
      const updated = prev.map(guest => {
        if (guest.id !== guestId) return guest;
        
        // Get the appropriate options based on whether guest is a child
        const isChildGuest = !!guest.isChild; // Force boolean conversion
        const relevantOptions = isChildGuest ? childDessertOptions : dessertOptions;
        const selectedOption = relevantOptions.find(opt => opt.id === dessert);
        
        return { 
          ...guest, 
          dessertChoice: { 
            id: dessert,
            name: selectedOption?.name || 'Unknown Option'
          } 
        };
      });
      saveToLocalStorage(updated);
      return updated;
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
      // Add detailed logging before submission
      console.log("About to submit RSVP with these guests:", JSON.stringify(guests.map(g => ({
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
        body: JSON.stringify({ guests }),
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
          {guests.map((guest) => (
            <MotionDiv
              key={guest.id}
                className="p-6 bg-black/30 rounded-lg border border-white/20 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
            <div className="flex items-center justify-between space-x-8">
              <h3 className="text-xl font-semibold text-white">{guest.name}</h3>
              <div className="flex items-center space-x-8">
              <span className={`text-sm transition-colors ${guest.isAttending === false ? 'text-white font-medium' : 'text-gray-400'}`}>
                Not Attending
              </span>
              <div className="flex items-center">
                <Switch
                checked={guest.isAttending === true}
                onCheckedChange={(checked) => handleAttendanceChange(guest.id, checked)}
                />
              </div>
              <span className={`text-sm transition-colors ${guest.isAttending === true ? 'text-white font-medium' : 'text-gray-400'}`}>
                Attending
              </span>
              </div>
            </div>

            <AnimatePresence>
            {guest.isAttending && (
                <MotionDiv
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meal Preference <span className="text-red-500">*</span>
                    </label>
                    <Select
                    value={guest.mealChoice?.id || ""}
                    onValueChange={(value) => handleMealChoice(guest.id, value)}
                    >
                    <SelectTrigger 
                      className={`bg-transparent border-white border-opacity-20 text-white h-12 ${
                      validationErrors[guest.id]?.includes('Meal choice is required') 
                        ? 'border-red-500' 
                        : ''
                      }`}
                    >
                      <SelectValue placeholder="Select your meal (Required)" />
                    </SelectTrigger>
                    {validationErrors[guest.id]?.includes('Meal choice is required') && (
                      <p className="text-red-500 text-sm mt-1">Please select a meal option</p>
                    )}
                  <SelectContent className="bg-black border border-white border-opacity-20 text-white" sideOffset={5}>
                    {(() => {
                      // More detailed debugging
                      const isChildGuest = !!guest.isChild; // Force boolean conversion
                      console.log(`Rendering meal options for ${guest.name}:`);
                      console.log(`  isChild=${isChildGuest} (${typeof guest.isChild})`);
                      console.log(`  Regular meal options count: ${mealOptions.length}`);
                      console.log(`  Child meal options count: ${childMealOptions.length}`);
                      
                      const optionsToShow = isChildGuest ? childMealOptions : mealOptions;
                      console.log(`  Options being shown:`, optionsToShow.map(o => o.name));
                      
                      if (optionsToShow.length === 0) {
                        console.warn(`  WARNING: No meal options available for ${isChildGuest ? 'child' : 'adult'} guest!`);
                        return <div className="p-2 text-red-500">No options available</div>;
                      }
                      
                      return optionsToShow.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          className="text-white hover:bg-white/10 cursor-pointer"
                        >
                          {option.name}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                  </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dessert Choice <span className="text-red-500">*</span>
                    </label>
                    <Select
                    value={guest.dessertChoice?.id || ""}
                    onValueChange={(value) => handleDessertChoice(guest.id, value)}
                    >
                    <SelectTrigger 
                      className={`bg-transparent border-white border-opacity-20 text-white h-12 ${
                      validationErrors[guest.id]?.includes('Dessert choice is required') 
                        ? 'border-red-500' 
                        : ''
                      }`}
                    >
                      <SelectValue placeholder="Select your dessert (Required)" />
                    </SelectTrigger>
                    {validationErrors[guest.id]?.includes('Dessert choice is required') && (
                      <p className="text-red-500 text-sm mt-1">Please select a dessert option</p>
                    )}
                  <SelectContent className="bg-black border border-white border-opacity-20 text-white" sideOffset={5}>
                    {(() => {
                      // More detailed debugging
                      const isChildGuest = !!guest.isChild; // Force boolean conversion
                      console.log(`Rendering dessert options for ${guest.name}:`);
                      console.log(`  isChild=${isChildGuest} (${typeof guest.isChild})`);
                      console.log(`  Regular dessert options count: ${dessertOptions.length}`);
                      console.log(`  Child dessert options count: ${childDessertOptions.length}`);
                      
                      const optionsToShow = isChildGuest ? childDessertOptions : dessertOptions;
                      console.log(`  Options being shown:`, optionsToShow.map(o => o.name));
                      
                      if (optionsToShow.length === 0) {
                        console.warn(`  WARNING: No dessert options available for ${isChildGuest ? 'child' : 'adult'} guest!`);
                        return <div className="p-2 text-red-500">No options available</div>;
                      }
                      
                      return optionsToShow.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          className="text-white hover:bg-white/10 cursor-pointer"
                        >
                          {option.name}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                  </Select>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Dietary Requirements
                </label>
                <Textarea
                value={guest.dietaryNotes || ""}
                onChange={(e) => handleDietaryNotes(guest.id, e.target.value)}
                placeholder="Any allergies or dietary requirements?"
                className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400"
                />
              </div>

                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {question.question}
                    {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                    {question.type === "MULTIPLE_SELECT" ? (
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const options = typeof question.options === 'string' ? 
                              JSON.parse(question.options) : 
                              question.options;
                            const selectedOptions = guest.responses?.find(r => r.questionId === question.id)?.answer || "[]";
                            const selectedValues = JSON.parse(selectedOptions);
                            
                            return Array.isArray(options) ? options.map((option: string) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${guest.id}-${question.id}-${option}`}
                                  checked={selectedValues.includes(option)}
                                  onCheckedChange={(checked) => {
                                    const currentValues = [...selectedValues];
                                    if (checked) {
                                      currentValues.push(option);
                                    } else {
                                      const index = currentValues.indexOf(option);
                                      if (index > -1) {
                                        currentValues.splice(index, 1);
                                      }
                                    }
                                    handleQuestionResponse(guest.id, question.id, JSON.stringify(currentValues));
                                  }}
                                  className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                />
                                <label
                                  htmlFor={`${guest.id}-${question.id}-${option}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                                >
                                  {option}
                                </label>
                              </div>
                            )) : [];
                          } catch {
                            return [];
                          }
                        })()}
                        {validationErrors[guest.id]?.includes(question.question) && (
                          <p className="text-red-500 text-sm mt-1">Please select at least one option</p>
                        )}
                      </div>
                    ) : question.type === "MULTIPLE_CHOICE" ? (
                      <>
                        <Select
                          value={guest.responses?.find(r => r.questionId === question.id)?.answer || ""}
                          onValueChange={(value) => handleQuestionResponse(guest.id, question.id, value)}
                        >
                          <SelectTrigger 
                            className={`bg-transparent border-white border-opacity-20 text-white h-12 ${
                              validationErrors[guest.id]?.includes(question.question) ? 'border-red-500' : ''
                            }`}
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white border-opacity-20">
                            {(() => {
                              try {
                                const options = typeof question.options === 'string' ? 
                                  JSON.parse(question.options) : 
                                  question.options;
                                return Array.isArray(options) ? options.map((option: string) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                )) : [];
                              } catch {
                                return [];
                              }
                            })()}
                          </SelectContent>
                        </Select>
                        {validationErrors[guest.id]?.includes(question.question) && (
                          <p className="text-red-500 text-sm mt-1">Please select an option</p>
                        )}
                      </>
                    ) : (
                    <>
                    <Textarea
                      value={guest.responses?.find(r => r.questionId === question.id)?.answer || ""}
                      onChange={(e) => handleQuestionResponse(guest.id, question.id, e.target.value)}
                      placeholder="Your answer"
                      className={`min-h-[80px] resize-none ${
                      validationErrors[guest.id]?.includes(`${question.question} is required`)
                        ? 'border-red-500'
                        : ''
                      }`}
                    />
                    {validationErrors[guest.id]?.includes(`${question.question} is required`) && (
                      <p className="text-red-500 text-sm mt-1">This field is required</p>
                    )}
                    </>
                  )}
                  </div>
                ))}
                </MotionDiv>
              )}
            </AnimatePresence>
            </MotionDiv>
          ))}
          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-gray-200" 
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit RSVP"}
          </Button>
          </form>
        </div>
        </MotionDiv>
        );
    }


