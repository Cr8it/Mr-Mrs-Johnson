"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { CsvUploadModal } from "./CsvUploadModal"
import GuestForm from "./GuestForm"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Download, 
  Upload, 
  Search, 
  UserPlus,
  Pencil,
  Trash2,
  Mail
} from "lucide-react"


interface Guest {
  id: string
  name: string
  email: string | null
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
  responses: Array<{
    questionId: string
    answer: string
    question: {
      question: string
      type: string
      options: string
      isRequired: boolean
    }
  }>
  household: {
    name: string
    code: string
  }
}

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchGuests()
  }, [])

  useEffect(() => {
    const filtered = guests.filter(guest =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.household.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredGuests(filtered)
  }, [searchTerm, guests])

  const fetchGuests = async () => {
    try {
      const response = await fetch("/api/admin/guests")
      if (!response.ok) throw new Error("Failed to fetch guests")
      const data = await response.json()
      console.log("Fetched data:", data) // Debug log
      setGuests(data.households.flatMap((h: any) => 
        h.guests.map((g: any) => ({
          ...g,
          household: {
            name: h.name,
            code: h.code,
          }
        }))
      ))
    } catch (error) {
      console.error("Fetch error:", error) // Debug log
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch guest list",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = (newHouseholds: any[]) => {
    fetchGuests()
    toast({
      title: "Success",
      description: "Guest list uploaded successfully",
    })
  }

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest)
    setIsGuestFormOpen(true)
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) return

    try {
      const response = await fetch(`/api/admin/guests/${guestId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete guest")

      setGuests(guests.filter(g => g.id !== guestId))
      setFilteredGuests(filteredGuests.filter(g => g.id !== guestId))
      
      toast({
        title: "Success",
        description: "Guest deleted successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete guest",
      })
    }
  }

  const handleSendToAll = async () => {
    const guestsWithEmail = filteredGuests.filter(g => g.email);
    if (guestsWithEmail.length === 0) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "No guests with email addresses found",
      });
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const guest of guestsWithEmail) {
        try {
          const response = await fetch("/api/admin/guests/send-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestId: guest.id }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`Successfully sent ${successCount} invites${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        setShowSuccessDialog(true);
      } else {
        toast({
          variant: "destructive",
          title: "❌ Error",
          description: "Failed to send any invites",
        });
      }
    } catch (error) {
      console.error("Send all invites error:", error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Failed to send invites",
      });
    }
  };


  const handleSendInvite = async (guest: Guest) => {
    if (!guest.email) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Guest has no email address",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/guests/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invite");
      }

      setSuccessMessage(`Invite sent to ${guest.name}`);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Send invite error:", error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to send invite",
      });
    }
  };


  const handleGuestSubmit = async (data: any) => {
    try {
      // Update the guests state with the new data
      setGuests(prevGuests => {
        const updatedGuests = [...prevGuests];
        const index = updatedGuests.findIndex(g => g.id === data.id);
        
        if (index !== -1) {
          // Update existing guest
          updatedGuests[index] = {
            ...updatedGuests[index],
            ...data,
            household: {
              name: data.household.name,
              code: data.household.code
            }
          };
        } else {
          // Add new guest
          updatedGuests.push({
            ...data,
            household: {
              name: data.household.name,
              code: data.household.code
            }
          });
        }
        
        return updatedGuests;
      });

      setIsGuestFormOpen(false);
      setSelectedGuest(null);
      
      toast({
        title: "Success",
        description: `Guest ${selectedGuest ? 'updated' : 'added'} successfully`,
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update guest list",
      });
    }
  }

  const handleExport = () => {
    try {
      const headers = [
        'Name',
        'Email',
        'Household',
        'Household Code',
        'RSVP Status',
        'Meal Choice',
        'Dessert Choice',
        'Dietary Notes',
        'Custom Responses'
      ].join(',');

      const rows = filteredGuests.map(guest => {
        const rsvpStatus = guest.isAttending === null ? 'Not Responded' : 
                          guest.isAttending ? 'Attending' : 'Not Attending';
        const customResponses = guest.responses?.map(r => 
          `${r.question.question}: ${r.answer}`
        ).join('; ') || '';

        return [
          `"${guest.name}"`,
          `"${guest.email || ''}"`,
          `"${guest.household.name}"`,
          `"${guest.household.code}"`,
          `"${rsvpStatus}"`,
          `"${guest.mealChoice?.name || ''}"`,
          `"${guest.dessertChoice?.name || ''}"`,
          `"${guest.dietaryNotes || ''}"`,
          `"${customResponses}"`
        ].join(',');
      });

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `guest-list-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Guest list exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export guest list",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <p className="text-gray-500">Loading guest list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-gold focus:ring-gold dark:text-gray-100"
          />
          </div>
          <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsUploadModalOpen(true)}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
          onClick={handleSendToAll}
          className="flex-1 sm:flex-none bg-gold hover:bg-[#c19b2f] text-white shadow-sm"
          >
          <Mail className="mr-2 h-4 w-4" />
          Send All Invites
          </Button>
          <Button 
          onClick={() => {
            setSelectedGuest(null)
            setIsGuestFormOpen(true)
          }}
          className="flex-1 sm:flex-none bg-white text-gray-900 hover:bg-gray-50 shadow-sm"
          >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Guest
          </Button>
        </div>
        </div>


        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-700">
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Name</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Email</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Household</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">RSVP Status</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Meal Choice</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Dessert Choice</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Dietary Notes</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Custom Responses</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.map((guest) => (
            <TableRow key={guest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <TableCell className="font-medium text-gray-900 dark:text-gray-100">{guest.name}</TableCell>
              <TableCell className="text-gray-600 dark:text-gray-300">{guest.email || "-"}</TableCell>
              <TableCell>
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-gray-100">{guest.household.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                Code: {guest.household.code}
                </span>
              </div>
              </TableCell>
              <TableCell>
              <RsvpStatus status={guest.isAttending} />
              </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">{guest.mealChoice?.name || "-"}</TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">{guest.dessertChoice?.name || "-"}</TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">{guest.dietaryNotes || "-"}</TableCell>
              <TableCell>
              {guest.responses?.map((response) => (
                <div key={response.questionId} className="mb-1 last:mb-0">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{response.question.question}: </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{response.answer}</span>
                </div>
              )) || "-"}
              </TableCell>
              <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendInvite(guest)}
                disabled={!guest.email}
                title={guest.email ? "Send Invite" : "No email address"}
                className="hover:bg-blue-50"
                >
                <Mail className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditGuest(guest)}
                className="hover:bg-amber-50"
                >
                <Pencil className="h-4 w-4 text-amber-500" />
                </Button>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteGuest(guest.id)}
                className="hover:bg-red-50"
                >
                <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              </TableCell>
            </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
        </div>

      <CsvUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

        <GuestForm
          isOpen={isGuestFormOpen}
          onClose={() => {
          setIsGuestFormOpen(false)
          setSelectedGuest(null)
          }}
          onSubmit={handleGuestSubmit}
          initialData={selectedGuest ? {
          id: selectedGuest.id,
          name: selectedGuest.name,
          email: selectedGuest.email || "",
          householdName: selectedGuest.household.name,
          isAttending: selectedGuest.isAttending,
          mealChoice: selectedGuest.mealChoice,
          dessertChoice: selectedGuest.dessertChoice,
          dietaryNotes: selectedGuest.dietaryNotes || ""
          } : undefined}
          mode={selectedGuest ? 'edit' : 'create'}
        />


        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
          <AlertDialogTitle>✉️ Success!</AlertDialogTitle>
          <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
          <AlertDialogAction className="bg-gold hover:bg-[#c19b2f] text-white">
            OK
          </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </div>
      )
}

function RsvpStatus({ status }: { status: boolean | null }) {
  if (status === null) {
    return (
        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        Not Responded
      </Badge>
    )
  }
  return status ? (
    <Badge variant="default" className="bg-green-100 text-green-700">
      Attending
    </Badge>
  ) : (
    <Badge variant="destructive" className="bg-red-100 text-red-700">
      Not Attending
    </Badge>
  )
}

