"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import GuestForm from "./GuestForm"
import { Response, Question, Guest, Household } from "@/components/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { LoaderCircle } from 'lucide-react'

interface RSVPProps {
  onClose?: () => void;
  onComplete?: (code: string) => void;
  onRSVPStatus?: (notAttending: boolean) => void;
}

// Add debugging component
const DebugInfo = ({ data, title }: { data: any, title: string }) => {
  const [showDebug, setShowDebug] = useState(false);
  return (
    <div className="mt-2 p-2 border border-dashed border-gray-500 rounded">
      <button 
        className="text-sm text-gray-400 underline"
        onClick={() => setShowDebug(!showDebug)}
      >
        {showDebug ? 'Hide' : 'Show'} {title}
      </button>
      {showDebug && (
        <pre className="mt-2 p-2 bg-gray-800 text-xs text-gray-300 overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default function RSVP({ onClose, onComplete, onRSVPStatus }: RSVPProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<Household | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [allNotAttending, setAllNotAttending] = useState(false)
  const { toast } = useToast()
  const [tab, setTab] = useState('search')

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
        <p className="text-center text-gold font-montserrat text-lg mb-8">
          Please respond by Sunday 22nd June
        </p>

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
            <div className="space-y-4">
              <Button 
                onClick={handleModifyResponse}
                className="w-full sm:w-auto bg-white text-black hover:bg-gray-200"
              >
                Modify Response
              </Button>
              {!allNotAttending && (
                <Button 
                  onClick={() => {
                    console.log("*** CLOSE BUTTON CLICKED ***");
                    console.log("Current state:", { 
                      showSuccess, 
                      allNotAttending,
                      onCloseType: typeof onClose,
                      storedOnCloseType: typeof storedOnClose,
                      hasOnClose: !!onClose,
                      hasStoredOnClose: !!storedOnClose,
                      hasLocalStorageFlag: localStorage.getItem('rsvp-has-parent-close') === 'true'
                    });
                    
                    // Use our reliable close handler
                    handleCloseModal();
                  }}
                  className="w-full bg-green-600 text-black font-medium hover:bg-green-700 hover:text-white"
                >
                  Close and View Wedding Details
                </Button>
              )}
            </div>
          </div>
            </MotionDiv>

        ) : !household || !showForm ? (
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
                    <div className="space-y-4">
                      <Button 
                        onClick={handleModifyResponse}
                        className="w-full sm:w-auto bg-white text-black hover:bg-gray-200"
                      >
                        Modify Response
                      </Button>
                      {!allNotAttending && (
                        <Button 
                          onClick={() => {
                            console.log("*** SECOND CLOSE BUTTON CLICKED ***");
                            console.log("Current state:", { 
                              showSuccess, 
                              allNotAttending,
                              onCloseType: typeof onClose,
                              storedOnCloseType: typeof storedOnClose,
                              hasOnClose: !!onClose,
                              hasStoredOnClose: !!storedOnClose 
                            });
                            
                            // Use our reliable close handler
                            handleCloseModal();
                          }}
                          className="w-full bg-green-600 text-black font-medium hover:bg-green-700 hover:text-white"
                        >
                          Close and View Wedding Details
                        </Button>
                      )}
                    </div>
                  </div>
                </MotionDiv>
              ) : (
                <>
                  <GuestForm
                    household={household}
                    onBack={handleBackToSearch}
                    onSuccess={handleRsvpSuccess}
                    parentOnClose={storedOnClose || onClose}
                  />
                  
                  {/* Add debugging info */}
                  {process.env.NODE_ENV === 'development' && (
                    <DebugInfo 
                      title="Household Child Status" 
                      data={household.guests.map((g: any) => ({ 
                        name: g.name, 
                        isChild: g.isChild 
                      }))} 
                    />
                  )}
                </>
              )}
            </div>
        )}
        </MotionDiv>
    </section>
  )
}

