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
    if (mode === 'edit') {
      fetchOptions()
    }
  }, [mode])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/rsvp/options')
      if (!response.ok) throw new Error('Failed to fetch options')
      const data = await response.json()
      setMealOptions(data.mealOptions)
      setChildMealOptions(data.childMealOptions || [])
      setDessertOptions(data.dessertOptions)
      setChildDessertOptions(data.childDessertOptions || [])
    } catch (error) {
      console.error('Fetch options error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load meal and dessert options",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const endpoint = mode === 'create' ? '/api/admin/guests' : `/api/admin/guests/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const submissionData = {
        name: formData.name,
        email: formData.email || null,
        householdName: formData.householdName,
        isAttending: formData.isAttending,
        mealChoice: formData.mealChoice ? { id: formData.mealChoice.id } : null,
        dessertChoice: formData.dessertChoice ? { id: formData.dessertChoice.id } : null,
        dietaryNotes: formData.dietaryNotes || null,
        isChild: formData.isChild || false
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save guest')
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


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <Select
                value={formData.isChild ? "true" : "false"}
                onValueChange={(value) => setFormData({ ...formData, isChild: value === "true" })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Is this a child?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
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