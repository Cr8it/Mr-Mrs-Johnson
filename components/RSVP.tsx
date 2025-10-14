"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import GuestForm from "./GuestForm"
import NameSearch from "./NameSearch"
import { Response, Question, Guest, Household } from "@/components/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { LoaderCircle, X } from 'lucide-react'

interface RSVPProps {
  onClose?: () => void;
  onComplete?: (code: string) => void;
  onRSVPStatus?: (notAttending: boolean) => void;
}

export default function RSVP({ onClose, onComplete, onRSVPStatus }: RSVPProps) {
  const [code, setCode] = useState("")
  const [household, setHousehold] = useState<Household | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [allNotAttending, setAllNotAttending] = useState(false)
  const [rsvpBlocked, setRsvpBlocked] = useState(false)
  const { toast } = useToast()
  const [tab, setTab] = useState('search')
  const [showBlockedMessage, setShowBlockedMessage] = useState(false)

  // Create a state to store the onClose function
  const [storedOnClose, setStoredOnClose] = useState<(() => void) | undefined>(onClose);

  // Store a flag in localStorage to indicate if we have a parent close function
  useEffect(() => {
    const hasOnClose = !!onClose;
    localStorage.setItem('rsvp-has-parent-close', hasOnClose ? 'true' : 'false');
    console.log("RSVP component mounted, hasOnClose:", hasOnClose);
    
    // Update the stored function when the prop changes
    if (onClose) {
      setStoredOnClose(() => onClose);
    }
    
    return () => {
      // Clean up when component unmounts
      console.log("RSVP component unmounting, cleaning up");
    };
  }, [onClose]);

  // This ensures we always have access to the latest onClose function
  const handleCloseModal = () => {
    console.log("Handling close modal request...");
    
    // First try the stored function
    if (storedOnClose) {
      console.log("Using stored onClose function");
      storedOnClose();
      return;
    }
    
    // Then try the prop directly
    if (onClose) {
      console.log("Using direct onClose prop");
      onClose();
      return;
    }
    
    // If nothing works, check localStorage for a flag
    const hasParentClose = localStorage.getItem('rsvp-has-parent-close');
    if (hasParentClose === 'true') {
      console.log("Parent close function exists but can't be accessed directly. Forcing page reload.");
      // Set a flag to indicate we need to return to home page
      localStorage.setItem('rsvp-completed', 'true');
      // Force a reload to the home page
      window.location.href = '/';
    } else {
      console.error("No close function available!");
      // As a last resort, try to navigate anyway
      window.location.href = '/';
    }
  };

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
    
    // Check if RSVPs are blocked before allowing search
    if (rsvpBlocked) {
      setShowBlockedMessage(true);
      toast({
        variant: "destructive",
        title: "RSVP Submissions Closed",
        description: "RSVP submissions are currently closed. Please contact Sarah and Jermaine directly if you have urgent questions.",
      })
      return
    }
    
    setLoading(true)
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
        const selectedHousehold = data.households[0];
        localStorage.setItem('rsvp-code', selectedHousehold.code);
        
        // Validate the household data for search results
        console.log("Processing search results for household:", selectedHousehold.name);
        
        // Ensure isChild is a boolean for each guest
        if (selectedHousehold.guests) {
          console.log("Search results - Raw guest data:", selectedHousehold.guests.map((g: any) => ({
            name: g.name,
            isChild: g.isChild,
            type: typeof g.isChild
          })));
          
          selectedHousehold.guests = selectedHousehold.guests.map((guest: any) => {
            // Ensure isChild is explicitly a boolean using strict equality
            const isChildValue = guest.isChild === true;
            
            console.log(`Search results - Processing guest ${guest.name}:`, {
              rawIsChild: guest.isChild,
              type: typeof guest.isChild,
              processedIsChild: isChildValue,
              type2: typeof isChildValue
            });
            
            return {
              ...guest,
              isChild: isChildValue // Force proper boolean
            };
          });
          
          console.log("Search results - Processed guests:", selectedHousehold.guests.map((g: any) => ({
            name: g.name,
            isChild: g.isChild,
            type: typeof g.isChild
          })));
        }
        
        setHousehold(selectedHousehold);
        setShowForm(true);
        toast({
          title: "Found your invitation!",
          description: `Welcome ${selectedHousehold.name}`,
        });
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
      setLoading(false)
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
        
        // Validate and ensure isChild is correctly set for each guest
        if (verifyData.household && verifyData.household.guests) {
          console.log("Received household data from server: ", {
            name: verifyData.household.name,
            code: verifyData.household.code,
            guestCount: verifyData.household.guests.length
          });
          
          // Ensure isChild is a boolean for each guest
          verifyData.household.guests = verifyData.household.guests.map((guest: { name: string; isChild?: boolean }) => {
            console.log(`Validating guest ${guest.name} from API:`, {
              originalIsChild: guest.isChild,
              type: typeof guest.isChild
            });
            
            return {
              ...guest,
              // Ensure isChild is explicitly a boolean
              isChild: guest.isChild === true
            };
          });
          
          console.log("After validation, guest isChild status:", 
            verifyData.household.guests.map((g: { name: string; isChild: boolean }) => ({ 
              name: g.name, 
              isChild: g.isChild,
              type: typeof g.isChild
            }))
          );
        }
        
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


  const handleModifyResponse = async () => {
    if (household?.code) {
      setShowSuccess(false);
      setCode(household.code);
      await fetchHouseholdData(household.code);
    }
  };






  const handleRsvpSuccess = (guests: Guest[]) => {
    console.log("RSVP success - Guests data:", guests.map(g => ({
      name: g.name,
      isAttending: g.isAttending,
      mealChoice: g.mealChoice,
      dessertChoice: g.dessertChoice
    })));
    
    // Check if ALL guests are not attending
    const notAttending = guests.every(guest => guest.isAttending === false);
    
    // Update state and localStorage
    setAllNotAttending(notAttending);
    localStorage.setItem('rsvp-attendance', JSON.stringify({ allNotAttending: notAttending }));
    
    // Store that we've completed RSVP
    localStorage.setItem('rsvp-completed', 'true');
    
    // Notify parent components about attendance status
    if (onRSVPStatus) {
      onRSVPStatus(notAttending);
    }
    
    // Store code and notify parent about completion
    if (household?.code) {
      localStorage.setItem('rsvp-code', household.code);
      if (onComplete) {
        onComplete(household.code);
      }
    }
    
    // Set success state
    setShowSuccess(true);
    
    console.log(`RSVP Success - All not attending: ${notAttending}, onClose available: ${!!storedOnClose || !!onClose}`);
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

  const handleCodeSuccess = (data: any) => {
    console.log('Household data received:', data);
    
    // Ensure isChild is a boolean for each guest
    if (data && data.guests) {
      data.guests = data.guests.map((guest: { name: string; isChild?: boolean }) => ({
        ...guest,
        isChild: guest.isChild === true
      }));
      
      console.log('Guest child status validated:', data.guests.map((g: { name: string; isChild: boolean }) => ({ 
        name: g.name, 
        isChild: g.isChild,
        type: typeof g.isChild
      })));
    }
    
    setHousehold(data);
    setTab('guestForm');
    setLoading(false);
  }

  const handleHouseholdFound = (data: any) => {
    console.log('Household found via name search:', data);
    
    // Ensure isChild is a boolean for each guest
    if (data && data.guests) {
      data.guests = data.guests.map((guest: { name: string; isChild?: boolean }) => ({
        ...guest,
        isChild: guest.isChild === true
      }));
    }
    
    setHousehold(data);
    setShowForm(true);
    setLoading(false);
    
    toast({
      title: "Welcome back!",
      description: `Found ${data.name}`,
    });
  }

  // Check if RSVPs are blocked on component mount
  useEffect(() => {
    const checkRsvpBlocked = async () => {
      try {
        const response = await fetch('/api/rsvp/blocked')
        const data = await response.json()
        setRsvpBlocked(data.rsvpBlocked || false)
        setShowBlockedMessage(data.rsvpBlocked || false)
      } catch (error) {
        console.error('Error checking RSVP blocked status:', error)
        setRsvpBlocked(false)
        setShowBlockedMessage(false)
      }
    }
    
    checkRsvpBlocked()
  }, [])

  return (
    <div className="relative bg-black text-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-semibold">RSVP</h2>
      </div>

        {showBlockedMessage ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-black/80 border-2 border-[#d4af37] rounded-xl shadow-lg p-10 max-w-xl w-full mx-auto flex flex-col items-center">
              <X className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-3xl font-bold text-[#d4af37] mb-2 text-center drop-shadow">RSVP Submissions Temporarily Closed</h3>
              <p className="text-lg font-semibold text-white mb-2 text-center">We're sorry, but RSVP submissions are currently closed.</p>
              <p className="text-base text-gray-100 mb-4 text-center">The deadline for RSVPs has passed, and we're finalizing our guest list and arrangements.</p>
              <p className="text-base text-gray-200 mb-6 text-center">If you have any urgent questions, please contact Sarah and Jermaine directly.</p>
              <Button 
                onClick={() => setShowBlockedMessage(false)}
                className="bg-gold hover:bg-[#c19b2f] text-white font-bold px-8 py-2 mt-2"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="search">Search by Code</TabsTrigger>
                <TabsTrigger value="name">Search by Name</TabsTrigger>
              </TabsList>

              <TabsContent value="search">
                {!household || !showForm ? (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="bg-black/30 p-4 sm:p-8 rounded-lg border border-white/20">
                      <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter your RSVP code or name"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400 text-center"
                            required
                            />
                            <p className="text-xs sm:text-sm text-gray-400 text-center">
                            Enter your unique code from the invitation or search by your name
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-white text-black hover:bg-gray-200" 
                          disabled={loading}
                        >
                          {loading ? "Searching..." : "Find My Invitation"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {showSuccess ? (
                      <MotionDiv
                        className="max-w-md mx-auto text-center space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-black/30 p-4 sm:p-8 rounded-lg border border-white/20">
                          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Thank You for Your Response!</h3>
                          {allNotAttending ? (
                          <p className="text-white mb-6 text-sm sm:text-base">We're sorry you won't be able to join us, but thank you for letting us know.</p>
                          ) : (
                          <p className="text-white mb-6 text-sm sm:text-base">We're excited to celebrate with you! We'll be in touch with more details as the day approaches.</p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-300 mb-6">
                          You can modify your response anytime before the deadline using your household code:
                          <br />
                          <span className="font-mono font-bold text-white">{household?.code}</span>
                          </p>
                          <Button 
                            onClick={onClose}
                            className="w-full bg-white text-black hover:bg-gray-200"
                          >
                            Close
                          </Button>
                        </div>
                      </MotionDiv>
                    ) : (
                      <GuestForm
                        household={household!}
                        onBack={() => {
                          setShowForm(false)
                          setHousehold(null)
                        }}
                        onSuccess={(updatedGuests) => {
                          setGuests(updatedGuests)
                          setShowSuccess(true)
                          setAllNotAttending(updatedGuests.every(g => g.isAttending === false))
                          if (onRSVPStatus) {
                            onRSVPStatus(updatedGuests.some(g => g.isAttending === true))
                          }
                        }}
                        parentOnClose={onClose}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="name">
                <NameSearch onFound={handleHouseholdFound} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

