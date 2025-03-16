import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Home, Users, Plus, X, UserPlus, Mail, UtensilsCrossed, AlertTriangle, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface GuestInput {
  name: string;
  email: string;
  mealPreference: string;
  allergies: string;
}

interface AddHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHousehold: (householdName: string, guests: GuestInput[]) => void;
}

export function AddHouseholdModal({ isOpen, onClose, onAddHousehold }: AddHouseholdModalProps) {
  const [loading, setLoading] = useState(false)
  const [householdName, setHouseholdName] = useState("")
  const [guests, setGuests] = useState<GuestInput[]>([])
  const [newGuest, setNewGuest] = useState<GuestInput>({
    name: "",
    email: "",
    mealPreference: "",
    allergies: "",
  })

  const handleAddGuest = () => {
    if (newGuest.name.trim()) {
      setGuests([...guests, { ...newGuest }])
      setNewGuest({
        name: "",
        email: "",
        mealPreference: "",
        allergies: "",
      })
    }
  }

  const handleRemoveGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (householdName.trim() && guests.length > 0) {
      setLoading(true)
      try {
        await onAddHousehold(householdName.trim(), guests)
        setHouseholdName("")
        setGuests([])
        onClose()
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Home className="h-5 w-5 text-gold" />
            Add New Household
          </DialogTitle>
          <DialogDescription>
            Create a new household and add guests to it
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Household Name
            </Label>
            <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Enter household name"
                className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Add Guest</Label>
              <Badge variant="secondary" className="text-xs">
                {guests.length} guests added
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  placeholder="Guest name"
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  placeholder="Email"
                  type="email"
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <UtensilsCrossed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  value={newGuest.mealPreference}
                  onChange={(e) => setNewGuest({ ...newGuest, mealPreference: e.target.value })}
                  placeholder="Meal preference"
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  value={newGuest.allergies}
                  onChange={(e) => setNewGuest({ ...newGuest, allergies: e.target.value })}
                  placeholder="Allergies"
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              type="button" 
              onClick={handleAddGuest} 
              disabled={!newGuest.name.trim()}
              className="w-full bg-gold hover:bg-[#c19b2f] text-white"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Guest to Household
            </Button>
          </div>

          {guests.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Added Guests</Label>
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-4 space-y-2">
                  {guests.map((guest, index) => (
                    <div 
                      key={index} 
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="grid grid-cols-2 gap-2 flex-grow mr-2">
                        <div className="space-y-1">
                            <div className="font-medium dark:text-gray-100">{guest.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{guest.email || "No email"}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm dark:text-gray-300">{guest.mealPreference || "No meal preference"}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{guest.allergies || "No allergies"}</div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveGuest(index)}
                        className="hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

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
              disabled={!householdName.trim() || guests.length === 0 || loading}
              className="flex-1 sm:flex-none bg-gold hover:bg-[#c19b2f] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Household...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Household
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

