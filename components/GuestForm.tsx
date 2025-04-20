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
import { Guest, Question, Response } from "@/components/types"
// Motion components
const MotionDiv = motion.div

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
  const [regularMealOptions, setRegularMealOptions] = useState<{ id: string; name: string }[]>([])
  const [childMealOptions, setChildMealOptions] = useState<{ id: string; name: string }[]>([])
  const [regularDessertOptions, setRegularDessertOptions] = useState<{ id: string; name: string }[]>([])
  const [childDessertOptions, setChildDessertOptions] = useState<{ id: string; name: string }[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [guests, setGuests] = useState<Guest[]>(() => {
    return household.guests.map(guest => {
      // Log the isChild value to make sure it's being correctly loaded
      console.log(`Initializing guest ${guest.name}, raw isChild=${guest.isChild}, type=${typeof guest.isChild}`);
      
      // Ensure isChild is properly cast to a boolean
      const isChildValue = guest.isChild === true;
      console.log(`  - Converted isChild for ${guest.name}: ${isChildValue} (${typeof isChildValue})`);
      
      return {
        ...guest,
        mealChoice: guest.mealChoice || null,
        dessertChoice: guest.dessertChoice || null,
        responses: guest.responses || [],
        isAttending: guest.isAttending ?? null,
        // Make sure isChild is explicitly a boolean
        isChild: isChildValue
      };
    });
  });

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
      console.log("Fetching meal and dessert options...");
      const optionsResponse = await fetch('/api/rsvp/form-data')
      const optionsData = await optionsResponse.json()
      
      if (!optionsResponse.ok) {
        throw new Error(optionsData.error || 'Failed to fetch options')
      }
      
      console.log("Received options data:", optionsData);
      
      if (optionsData.mealOptions?.length > 0) {
        console.log(`Setting ${optionsData.mealOptions.length} regular meal options`);
        setRegularMealOptions(optionsData.mealOptions)
      }
      if (optionsData.childMealOptions?.length > 0) {
        console.log(`Setting ${optionsData.childMealOptions.length} child meal options:`, 
          optionsData.childMealOptions.map((o: any) => ({ id: o.id, name: o.name, isChildOption: o.isChildOption })));
        setChildMealOptions(optionsData.childMealOptions)
      } else {
        console.warn("No child meal options received!");
      }
      if (optionsData.dessertOptions?.length > 0) {
        console.log(`Setting ${optionsData.dessertOptions.length} regular dessert options`);
        setRegularDessertOptions(optionsData.dessertOptions)
      }
      if (optionsData.childDessertOptions?.length > 0) {
        console.log(`Setting ${optionsData.childDessertOptions.length} child dessert options:`, 
          optionsData.childDessertOptions.map((o: any) => ({ id: o.id, name: o.name, isChildOption: o.isChildOption })));
        setChildDessertOptions(optionsData.childDessertOptions)
      } else {
        console.warn("No child dessert options received!");
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
    const newGuests = household.guests.map(guest => {
      console.log(`Updating guest ${guest.name} from household change, raw isChild=${guest.isChild}, type=${typeof guest.isChild}`);
      
      // Ensure isChild is properly cast to a boolean
      const isChildValue = guest.isChild === true;
      console.log(`  - Converted isChild for ${guest.name}: ${isChildValue} (${typeof isChildValue})`);
      
      return {
        ...guest,
        mealChoice: guest.mealChoice || null,
        dessertChoice: guest.dessertChoice || null,
        responses: guest.responses || [],
        isAttending: guest.isAttending ?? null,
        // Make sure isChild flag is explicitly a boolean
        isChild: isChildValue
      };
    });
    
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
    regularMealOptions,
    childMealOptions,
    regularDessertOptions,
    childDessertOptions,
    questions,
    guests: guests.map(g => ({
      id: g.id,
      name: g.name,
      isChild: g.isChild,
      isAttending: g.isAttending
    }))
  })

  const saveToLocalStorage = (updatedGuests: Guest[]) => {
    const storageKey = `rsvp-${household.code}`;
    localStorage.setItem(storageKey, JSON.stringify({ 
      guests: updatedGuests,
      questions,
      code: household.code
    }));
  };

  // Debug function to help identify meal option selection issues
  const debugMealOptions = (guest: Guest) => {
    console.log(`DEBUG - Meal options for ${guest.name}:`, {
      isChild: guest.isChild,
      availableOptions: guest.isChild ? childMealOptions : regularMealOptions,
      selectedOption: guest.mealChoice,
      childOptionsCount: childMealOptions.length,
      regularOptionsCount: regularMealOptions.length
    });
  };

  // Debug function to help identify dessert option selection issues
  const debugDessertOptions = (guest: Guest) => {
    console.log(`DEBUG - Dessert options for ${guest.name}:`, {
      isChild: guest.isChild,
      availableOptions: guest.isChild ? childDessertOptions : regularDessertOptions,
      selectedOption: guest.dessertChoice,
      childOptionsCount: childDessertOptions.length,
      regularOptionsCount: regularDessertOptions.length
    });
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
        
        // Call debug function to log information about this selection
        debugMealOptions(guest);
        
        // Find the correct option name based on whether this is a child
        const options = guest.isChild ? childMealOptions : regularMealOptions;
        const selectedOption = options.find(opt => opt.id === meal);
        
        if (!selectedOption) {
          console.error(`Could not find meal option with ID ${meal} for ${guest.name} (isChild: ${guest.isChild})`);
        }
        
        return { 
          ...guest, 
          mealChoice: { 
            id: meal,
            name: selectedOption?.name || 'Unknown option'
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
        
        // Call debug function to log information about this selection
        debugDessertOptions(guest);
        
        // Find the correct option name based on whether this is a child
        const options = guest.isChild ? childDessertOptions : regularDessertOptions;
        const selectedOption = options.find(opt => opt.id === dessert);
        
        if (!selectedOption) {
          console.error(`Could not find dessert option with ID ${dessert} for ${guest.name} (isChild: ${guest.isChild})`);
        }
        
        return { 
          ...guest, 
          dessertChoice: { 
            id: dessert,
            name: selectedOption?.name || 'Unknown option'
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

    // Log what we're about to submit for debugging
    console.log("Submitting guest data:", guests.map(g => ({
      id: g.id,
      name: g.name,
      isAttending: g.isAttending,
      mealChoice: g.mealChoice,
      dessertChoice: g.dessertChoice,
      isChild: g.isChild
    })));

    try {
      const response = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          guests: guests.map(guest => ({
            id: guest.id,
            name: guest.name,
            isAttending: guest.isAttending,
            mealChoice: guest.mealChoice,
            dessertChoice: guest.dessertChoice,
            dietaryNotes: guest.dietaryNotes,
            responses: guest.responses,
            isChild: guest.isChild
          }))
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit RSVP");
      }

      const data = await response.json();
      console.log("RSVP submission response:", data);

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
    regularMealOptions,
    childMealOptions,
    regularDessertOptions,
    childDessertOptions,
    guests: guests.map(g => ({ id: g.id, name: g.name, isChild: g.isChild }))
  })

  // Add this function to log when child options are used
  const logChildOptionsUsage = () => {
    console.log("CHILD OPTIONS SUMMARY:");
    console.log("- Regular meal options:", regularMealOptions.length, regularMealOptions.map(o => o.name));
    console.log("- Child meal options:", childMealOptions.length, childMealOptions.map(o => o.name));
    console.log("- Regular dessert options:", regularDessertOptions.length, regularDessertOptions.map(o => o.name));
    console.log("- Child dessert options:", childDessertOptions.length, childDessertOptions.map(o => o.name));
    
    guests.forEach(guest => {
      console.log(`Guest ${guest.name}:`, {
        isChild: guest.isChild,
        willUseMealOptions: guest.isChild ? 'child' : 'regular',
        willUseDessertOptions: guest.isChild ? 'child' : 'regular',
        mealChoice: guest.mealChoice,
        dessertChoice: guest.dessertChoice
      });
    });
  };
  
  // Call this in useEffect to log each time options change
  useEffect(() => {
    logChildOptionsUsage();
  }, [regularMealOptions, childMealOptions, regularDessertOptions, childDessertOptions, guests]);

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

            {/* Debugging information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-2 bg-yellow-800/50 rounded text-xs mt-2 border border-yellow-600">
                <p className="font-bold border-b border-yellow-600 pb-1 mb-1">Debug Info:</p>
                <p className="mb-1"><span className="font-semibold">isChild:</span> {String(guest.isChild)}</p>
                <p className="mb-1"><span className="font-semibold">Child meal options:</span> {childMealOptions.length} available</p>
                <p className="mb-1"><span className="font-semibold">Regular meal options:</span> {regularMealOptions.length} available</p>
                <p className="mb-1"><span className="font-semibold">Will use:</span> {guest.isChild ? "Child options" : "Adult options"}</p>
              </div>
            )}

            <AnimatePresence>
            {guest.isAttending && (
                <MotionDiv
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                {/* Custom Questions First */}
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
                          className={`min-h-[80px] resize-none bg-transparent border-white border-opacity-20 text-white ${
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

                {/* Then Meal and Dessert Options */}
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
                    {process.env.NODE_ENV === 'development' && (
                      <div className="p-2 bg-blue-900/30 mb-2 text-xs">
                        <p>Using {guest.isChild ? "child" : "adult"} meal options</p>
                        <p>Options count: {(guest.isChild ? childMealOptions : regularMealOptions).length}</p>
                      </div>
                    )}
                    {guest.isChild ? childMealOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    )) : regularMealOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
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
                      {process.env.NODE_ENV === 'development' && (
                        <div className="p-2 bg-blue-900/30 mb-2 text-xs">
                          <p>Using {guest.isChild ? "child" : "adult"} dessert options</p>
                          <p>Options count: {(guest.isChild ? childDessertOptions : regularDessertOptions).length}</p>
                        </div>
                      )}
                      {guest.isChild ? childDessertOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      )) : regularDessertOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
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


