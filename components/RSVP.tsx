"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import GuestForm from "./GuestForm"
import { Response, Question } from "@/components/types"

interface Guest {
  id: string
  name: string
  email?: string
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

interface Household {
  name: string
  code: string
  guests: Guest[]
  questions?: Question[]
}

interface RSVPProps {
  onClose?: () => void;
  onComplete?: (code: string) => void;
  onRSVPStatus?: (notAttending: boolean) => void;
}

export default function RSVP({ onClose, onComplete, onRSVPStatus }: RSVPProps) {
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [household, setHousehold] = useState<Household | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [allNotAttending, setAllNotAttending] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const storedCode = localStorage.getItem('rsvp-code')
    if (storedCode) {
      fetchHouseholdData(storedCode)
    }
  }, []) // Empty dependency array for mount-only effect

  useEffect(() => {
    const checkSavedAttendance = () => {
      const savedAttendance = localStorage.getItem('rsvp-attendance');
      if (savedAttendance) {
        try {
          const { allNotAttending: savedNotAttending } = JSON.parse(savedAttendance);
          setAllNotAttending(savedNotAttending);
          if (onRSVPStatus) {
            onRSVPStatus(savedNotAttending);
          }
        } catch (error) {
          // If there's any error parsing attendance data, reset state
          setAllNotAttending(false);
          localStorage.removeItem('rsvp-attendance');
        }
      }
    };

    checkSavedAttendance();
  }, [onRSVPStatus]);

  useEffect(() => {
    const handleModification = async () => {
      const modifying = localStorage.getItem('modifying-rsvp');
      const rsvpCode = localStorage.getItem('rsvp-code');
      
      if (modifying === 'true' && rsvpCode) {
        setShowSuccess(false);
        setHousehold(null);
        setCode(rsvpCode);
        await fetchHouseholdData(rsvpCode);
        localStorage.removeItem('modifying-rsvp');
      }
    };

    handleModification();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setShowSuccess(false)

    try {
      // First try searching by code
      const codeResponse = await fetch("/api/rsvp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })

          if (codeResponse.ok) {
          const data = await codeResponse.json()
          // Store the code for later use
          localStorage.setItem('rsvp-code', data.household.code)
          
          // Check for saved form data
          const storageKey = `rsvp-${data.household.code}`;
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setHousehold({
            ...data.household,
            guests: parsedData.guests || data.household.guests,
            questions: parsedData.questions || data.household.questions
            });
          } else {
            setHousehold(data.household);
          }
          setShowForm(true); // Show the form
          toast({
            title: "Welcome back!",
            description: `Found ${data.household.name}`,
          })
          return
          }

      // If not found by code, try searching by name
      const nameResponse = await fetch("/api/rsvp/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: code.trim() }),
      })

      if (!nameResponse.ok) {
        throw new Error("Failed to find invitation")
      }

      const data = await nameResponse.json()
        if (data.households.length > 0) {
        // Store the code for later use
        localStorage.setItem('rsvp-code', data.households[0].code)
        setHousehold(data.households[0])
        setShowForm(true)
        toast({
          title: "Found your invitation!",
          description: `Welcome ${data.households[0].name}`,
        })
      } else {
        throw new Error("No household found for that name or code")
      }
    } catch (error) {
      console.error("RSVP Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to find invitation",
      })
      setHousehold(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchHouseholdData = async (householdCode: string) => {
    try {
      const verifyResponse = await fetch("/api/rsvp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: householdCode.trim() }),
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        
        // Check for saved form data
        const storageKey = `rsvp-${householdCode}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Merge saved data with fetched data
          setHousehold({
            ...verifyData.household,
            guests: parsedData.guests || verifyData.household.guests,
            questions: parsedData.questions || verifyData.household.questions
          });
        } else {
          setHousehold(verifyData.household);
        }
        
        setShowForm(true);
        setShowSuccess(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching household data:", error);
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Add null check for household
      if (!household) {
        setError("No household data found. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Normalize guest data before submission
      const normalizedGuests = household.guests.map(guest => {
        // More robust boolean conversion for isChild
        const rawValue = guest.isChild;
        const isChildValue = (() => {
          if (typeof rawValue === 'string') {
            // Assert rawValue as string to satisfy TypeScript
            const strValue = rawValue as string; 
            // Handle common string representations of true
            return strValue.toLowerCase() === 'true' || strValue === '1' || strValue.toLowerCase() === 'yes' || strValue.toLowerCase() === 'y';
          }
          // Handle numeric representations (1 is true, 0 is false)
          if (typeof rawValue === 'number') {
            return rawValue === 1;
          }
          // Default to standard boolean conversion for other types (including actual booleans)
          return Boolean(rawValue);
        })();
        
        return {
          ...guest,
          isChild: isChildValue
        };
      });

      const requestBody = {
        ...household,
        guests: normalizedGuests
      };

      const response = await fetch(`/api/rsvp/${household.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        handleRsvpSuccess(data.household.guests);
      } else {
        throw new Error("Failed to submit RSVP");
      }
    } catch (error) {
      console.error("RSVP Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit RSVP",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModifyResponse = async () => {
    if (household?.code) {
      setShowSuccess(false);
      setCode(household.code);
      await fetchHouseholdData(household.code);
    }
  };

  const handleRsvpSuccess = (guests: Guest[]) => {
    const notAttending = guests.every(guest => guest.isAttending === false);
    setAllNotAttending(notAttending);
    localStorage.setItem('rsvp-attendance', JSON.stringify({ allNotAttending: notAttending }));
    if (onRSVPStatus) {
      onRSVPStatus(notAttending);
    }
    if (household?.code) {
      localStorage.setItem('rsvp-code', household.code);
      if (onComplete) {
        onComplete(household.code);
      }
    }
    // Only set success state, don't hide form
    setShowSuccess(true);
  };

  const handleBackToSearch = () => {
    setHousehold(null);
    setShowForm(false);
    setCode("");
  };

  const handleModalClose = () => {
    // If we're in success state and at least one guest is attending, allow closing
    if (showSuccess && !allNotAttending) {
      if (onClose) onClose();
      return;
    }
    
    // Check if any guest has toggled their attendance status
    const hasToggledAttendance = household?.guests.some(guest => guest.isAttending !== null);
    
    if (!hasToggledAttendance) {
      toast({
        variant: "destructive",
        title: "Cannot Close",
        description: "Please indicate attendance status for at least one guest.",
      });
      return;
    }
    
    if (allNotAttending) {
      toast({
        variant: "destructive",
        title: "Cannot Close",
        description: "At least one guest must be attending to view wedding information.",
      });
      return;
    }
    
    if (onClose) onClose();
  };

  const MotionDiv = motion.div

  return (
    <section id="rsvp" className="py-12">
        <MotionDiv
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        <h2 className="text-5xl font-cormorant font-bold text-center text-white mb-4">
          RSVP
        </h2>

        {showSuccess ? (
            <MotionDiv
              className="max-w-md mx-auto text-center space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
            <div className="bg-black/30 p-8 rounded-lg border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-4">Thank You for Your Response!</h3>
            {allNotAttending ? (
            <p className="text-white mb-6">We're sorry you won't be able to join us, but thank you for letting us know.</p>
            ) : (
            <p className="text-white mb-6">We're excited to celebrate with you! We'll be in touch with more details as the day approaches.</p>
            )}
            <p className="text-sm text-gray-300 mb-6">
            You can modify your response anytime before the deadline using your household code:
            <br />
            <span className="font-mono font-bold text-white">{household?.code}</span>
            </p>
            <div className="space-y-4">
              <Button 
                onClick={handleModifyResponse}
                className="bg-white text-black hover:bg-gray-200"
              >
                Modify Response
              </Button>
              {!allNotAttending && (
                <Button 
                  onClick={handleModalClose}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                >
                  Close and View Wedding Details
                </Button>
              )}
            </div>
          </div>
            </MotionDiv>

        ) : !household || !showForm ? (
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-black/30 p-8 rounded-lg border border-white/20">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter your RSVP code or name"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400 text-center"
                    required
                    />
                    <p className="text-sm text-gray-400 text-center">
                    Enter your unique code from the invitation or search by your name
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-gray-200" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Searching..." : "Find My Invitation"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
            <GuestForm
            household={household}
            onBack={handleBackToSearch}
            onSuccess={handleRsvpSuccess}
            />
        )}
        </MotionDiv>
    </section>
  )
}

