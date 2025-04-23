"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { UserPlus, Pencil, Check, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Option {
  id: string
  name: string
  isChildOption?: boolean
}

interface GuestFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: {
    id?: string
    name: string
    email: string
    householdName: string
    isAttending?: boolean | null
    mealChoice?: Option | null
    dessertChoice?: Option | null
    dietaryNotes?: string | null
    isChild?: boolean
  }
  mode?: 'create' | 'edit'
}

interface GuestResponse {
  id: string
  name: string
  email: string | null
  isAttending: boolean | null
  mealChoice: string | null
  dietaryNotes: string | null
  householdId: string
  household: {
    id: string
    name: string
    code: string
  }
}

const GuestForm = ({ isOpen, onClose, onSubmit, initialData, mode = 'create' }: GuestFormProps) => {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    email: "",
    householdName: "",
    isAttending: null,
    mealChoice: null,
    dessertChoice: null,
    dietaryNotes: "",
    isChild: false
  })
  const [loading, setLoading] = useState(false)
  const [mealOptions, setMealOptions] = useState<Option[]>([])
  const [childMealOptions, setChildMealOptions] = useState<Option[]>([])
  const [dessertOptions, setDessertOptions] = useState<Option[]>([])
  const [childDessertOptions, setChildDessertOptions] = useState<Option[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchOptions()
      console.log("GuestForm opened, mode:", mode, "initialData:", initialData)
    }
  }, [isOpen, mode])

  useEffect(() => {
    if (initialData) {
      // Force isChild to be a boolean by using strict comparison
      const isChildValue = initialData.isChild === true;
      console.log(`Initializing form for ${initialData.name} with isChild=${initialData.isChild} (${typeof initialData.isChild}), processed to: ${isChildValue}`);
      
      setFormData({
        ...initialData,
        isChild: isChildValue
      });
    }
  }, [initialData])

  const fetchOptions = async () => {
    try {
      console.log("Fetching meal and dessert options...")
      
      // Add error handling and timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      const response = await fetch('/api/rsvp/options', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Failed to fetch options: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch options: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Options received:", data);
      
      // Use defensive programming with default empty arrays
      setMealOptions(Array.isArray(data.mealOptions) ? data.mealOptions : []);
      setChildMealOptions(Array.isArray(data.childMealOptions) ? data.childMealOptions : []);
      setDessertOptions(Array.isArray(data.dessertOptions) ? data.dessertOptions : []);
      setChildDessertOptions(Array.isArray(data.childDessertOptions) ? data.childDessertOptions : []);
      
      console.log("Options processed successfully");
    } catch (error) {
      console.error('Fetch options error:', error);
      // Don't fail the form load if options can't be fetched
      setMealOptions([]);
      setChildMealOptions([]);
      setDessertOptions([]);
      setChildDessertOptions([]);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load meal options. You can still edit other fields.",
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validate input data
      if (!formData.name.trim()) {
        throw new Error("Guest name is required");
      }
      
      if (!formData.householdName.trim()) {
        throw new Error("Household name is required");
      }
      
      console.log('Submitting form with isChild =', formData.isChild);
      
      const endpoint = mode === 'create' ? '/api/admin/guests' : `/api/admin/guests/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Create a clean submission data object with proper defaults
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : null,
        householdName: formData.householdName.trim(),
        isAttending: formData.isAttending,
        mealChoice: formData.mealChoice ? { id: formData.mealChoice.id } : null,
        dessertChoice: formData.dessertChoice ? { id: formData.dessertChoice.id } : null,
        dietaryNotes: formData.dietaryNotes ? formData.dietaryNotes.trim() : null,
        isChild: formData.isChild === true
      }

      console.log('Submission data:', submissionData);

      // Add timeout and abort controller for the fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error occurred' };
        }
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const responseData = await response.json()
      onSubmit(responseData)
      onClose()
      
      if (mode === 'create') {
        setFormData({
          name: "",
          email: "",
          householdName: "",
          isAttending: null,
          mealChoice: null,
          dessertChoice: null,
          dietaryNotes: "",
          isChild: false
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save guest',
      })
    } finally {
      setLoading(false)
    }
  }

  // Direct fix for Niyah Dublin or any other child guest showing wrong options
  const fixIsChildStatus = async (guestId: string, correctValue: boolean) => {
    try {
      setLoading(true);
      console.log(`Fixing isChild status for guest ID ${guestId} to ${correctValue}`);
      
      if (!guestId) {
        throw new Error('Guest ID is required');
      }
      
      // Direct database update to fix the issue
      const response = await fetch(`/api/admin/guests/${guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isChild: correctValue
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update child status');
      }
      
      const updatedGuest = await response.json();
      console.log('Updated guest data:', updatedGuest);
      
      // Update the form data
      setFormData({
        ...formData,
        isChild: correctValue
      });
      
      toast({
        title: "Success",
        description: `Updated child status for ${formData.name}`,
      });
    } catch (error) {
      console.error('Error fixing child status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update child status",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <UserPlus className="h-5 w-5 text-gold" />
                Add New Guest
              </>
            ) : (
              <>
                <Pencil className="h-5 w-5 text-gold" />
                Edit Guest
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9"
                placeholder="guest@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="household" className="text-sm font-medium">
                Household Name
              </Label>
              <Input
                id="household"
                value={formData.householdName}
                onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
                className="h-9"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isChild" className="text-sm font-medium">
                Child
              </Label>
              <div className="flex flex-col gap-2">
                <Select
                  value={formData.isChild ? "true" : "false"}
                  onValueChange={(value) => {
                    const newValue = value === "true";
                    console.log('Child status changed to:', newValue);
                    setFormData({ ...formData, isChild: newValue });
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Is this a child?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
                
                {initialData?.id && (
                  <div className="text-xs text-gray-500">
                    <p>Raw isChild value: {String(initialData.isChild)}</p>
                    <p>Current form value: {String(formData.isChild)}</p>
                    <div className="flex gap-2 mt-1">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fixIsChildStatus(initialData.id!, true)}
                        disabled={loading}
                      >
                        Force Set Child: Yes
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fixIsChildStatus(initialData.id!, false)}
                        disabled={loading}
                      >
                        Force Set Child: No
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {mode === 'edit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="isAttending" className="text-sm font-medium">
                    Attending
                  </Label>
                  <Select
                    value={formData.isAttending?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, isAttending: value === "true" })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select attendance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.isAttending && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mealChoice" className="text-sm font-medium">
                        Meal Choice
                      </Label>
                      <Select
                        value={formData.mealChoice?.id || ""}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          mealChoice: (formData.isChild ? childMealOptions : mealOptions).find(option => option.id === value) || null 
                        })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select meal" />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.isChild ? childMealOptions : mealOptions).map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dessertChoice" className="text-sm font-medium">
                        Dessert Choice
                      </Label>
                      <Select
                        value={formData.dessertChoice?.id || ""}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          dessertChoice: (formData.isChild ? childDessertOptions : dessertOptions).find(option => option.id === value) || null 
                        })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select dessert" />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.isChild ? childDessertOptions : dessertOptions).map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dietaryNotes" className="text-sm font-medium">
                        Dietary Notes
                      </Label>
                      <Textarea
                        id="dietaryNotes"
                        value={formData.dietaryNotes || ""}
                        onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
                        className="min-h-[80px] resize-none"
                        placeholder="Any dietary requirements or allergies..."
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 sm:flex-none bg-gold hover:bg-[#c19b2f] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? "Adding..." : "Saving..."}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Guest
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default GuestForm