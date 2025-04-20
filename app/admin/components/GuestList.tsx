"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Mail,
  ChevronDown,
  ChevronUp,
  Users,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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

interface Household {
  name: string
  code: string
  guests: Guest[]
  isExpanded?: boolean
}

interface GuestListProps {
  onGuestCountChange?: (count: number) => void
}

const GUESTS_PER_PAGE = 5; // Number of households per page

export default function GuestList({ onGuestCountChange }: GuestListProps) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<'name' | 'guests' | 'responses'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchGuests()
  }, [])

  // Memoized calculations for pagination
  const totalPages = useMemo(() => 
    Math.ceil(filteredHouseholds.length / GUESTS_PER_PAGE),
    [filteredHouseholds]
  )

  const paginatedHouseholds = useMemo(() => {
    const start = (currentPage - 1) * GUESTS_PER_PAGE
    return filteredHouseholds.slice(start, start + GUESTS_PER_PAGE)
  }, [filteredHouseholds, currentPage])

  const fetchGuests = async () => {
    try {
      const response = await fetch("/api/admin/guests")
      if (!response.ok) throw new Error("Failed to fetch guests")
      const data = await response.json()
      
      // Group guests by household
      const householdMap = new Map<string, Household>()
      data.households.forEach((h: any) => {
        householdMap.set(h.code, {
          name: h.name,
          code: h.code,
          guests: h.guests,
          isExpanded: false
        })
      })
      
      const householdArray = Array.from(householdMap.values())
      setHouseholds(householdArray)
      setFilteredHouseholds(householdArray)
      
      // Update total guest count
      if (onGuestCountChange) {
        const totalGuests = householdArray.reduce((sum, h) => sum + h.guests.length, 0)
        onGuestCountChange(totalGuests)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch guest list",
      })
    } finally {
      setLoading(false)
    }
  }

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHouseholds(households)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = households.filter(household => {
      const householdMatch = household.name.toLowerCase().includes(searchLower)
      const guestMatch = household.guests.some(guest => 
        guest.name.toLowerCase().includes(searchLower) ||
        guest.email?.toLowerCase().includes(searchLower)
      )
      return householdMatch || guestMatch
    })

    setFilteredHouseholds(filtered)
    setCurrentPage(1) // Reset to first page when searching
  }, [searchTerm, households])

  // Sorting functionality
  const handleSort = (field: 'name' | 'guests' | 'responses') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  useEffect(() => {
    const sorted = [...filteredHouseholds].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'guests':
          comparison = a.guests.length - b.guests.length
          break
        case 'responses':
          const aResponses = a.guests.filter(g => g.isAttending !== null).length
          const bResponses = b.guests.filter(g => g.isAttending !== null).length
          comparison = aResponses - bResponses
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    setFilteredHouseholds(sorted)
  }, [sortField, sortDirection])

  const toggleHousehold = (code: string) => {
    setExpandedHouseholds(prev => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
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

      setHouseholds(households.map(h => ({
        ...h,
        guests: h.guests.filter(g => g.id !== guestId)
      })))
      setFilteredHouseholds(filteredHouseholds.map(h => ({
        ...h,
        guests: h.guests.filter(g => g.id !== guestId)
      })))
      
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
    const guestsWithEmail = filteredHouseholds.flatMap(h => h.guests.filter(g => g.email));
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
        toast({
          title: "Success",
          description: `Successfully sent ${successCount} invites${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        });
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

      toast({
        title: "Success",
        description: `Invite sent to ${guest.name}`,
      });
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
      // Update the households state with the new data
      setHouseholds(prevHouseholds => {
        const updatedHouseholds = [...prevHouseholds];
        const index = updatedHouseholds.findIndex(h => h.code === data.household.code);
        
        if (index !== -1) {
          // Update existing household
          updatedHouseholds[index] = {
            ...updatedHouseholds[index],
            ...data,
            guests: [...updatedHouseholds[index].guests.filter(g => g.id !== data.id), data]
          };
        } else {
          // Add new household
          updatedHouseholds.push({
            ...data,
            guests: [data]
          });
        }
        
        return updatedHouseholds;
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

      const rows = filteredHouseholds.flatMap(household => 
        household.guests.map((guest) => {
          const rsvpStatus = guest.isAttending === null ? 'Not Responded' : 
                            guest.isAttending ? 'Attending' : 'Not Attending';
          const customResponses = guest.responses?.map(r => 
            `${r.question.question}: ${r.answer}`
          ).join('; ') || '';

          return [
            `"${guest.name}"`,
            `"${guest.email || ''}"`,
            `"${household.name}"`,
            `"${household.code}"`,
            `"${rsvpStatus}"`,
            `"${guest.mealChoice?.name || ''}"`,
            `"${guest.dessertChoice?.name || ''}"`,
            `"${guest.dietaryNotes || ''}"`,
            `"${customResponses}"`
          ].join(',');
        })
      );

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search households or guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(value: any) => handleSort(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Household Name</SelectItem>
              <SelectItem value="guests">Number of Guests</SelectItem>
              <SelectItem value="responses">Response Rate</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleSort(sortField)}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Households List */}
      <AnimatePresence>
        {paginatedHouseholds.map((household) => (
          <motion.div
            key={household.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleHousehold(household.code)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{household.name}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {household.guests.length}
                    </Badge>
                    <Badge 
                      variant={getResponseBadgeVariant(household)}
                      className="flex items-center gap-1"
                    >
                      {getResponseRate(household)}% Responded
                    </Badge>
                  </div>
                  {expandedHouseholds.has(household.code) ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </div>
                <CardDescription>Code: {household.code}</CardDescription>
              </CardHeader>

              {expandedHouseholds.has(household.code) && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Meal Choice</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {household.guests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell>{guest.name}</TableCell>
                          <TableCell>{guest.email || '-'}</TableCell>
                          <TableCell>
                            <RsvpStatus status={guest.isAttending} />
                          </TableCell>
                          <TableCell>
                            {guest.isAttending ? (
                              guest.mealChoice?.name || 'Not selected'
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditGuest(guest)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {guest.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSendInvite(guest)}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteGuest(guest.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* No Results */}
      {filteredHouseholds.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No households found matching your search.</p>
        </div>
      )}

      {/* Modals */}
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
        initialData={selectedGuest || undefined}
        mode={selectedGuest ? 'edit' : 'create'}
      />
    </div>
  )
}

// Helper functions
function getResponseRate(household: Household): number {
  const totalGuests = household.guests.length
  const responded = household.guests.filter(g => g.isAttending !== null).length
  return Math.round((responded / totalGuests) * 100)
}

function getResponseBadgeVariant(household: Household): "default" | "secondary" | "destructive" {
  const rate = getResponseRate(household)
  if (rate === 100) return "default"
  if (rate > 0) return "secondary"
  return "destructive"
}

function RsvpStatus({ status }: { status: boolean | null }) {
  if (status === null) {
    return <Badge variant="secondary">Pending</Badge>
  }
  return status ? (
    <Badge variant="default">Attending</Badge>
  ) : (
    <Badge variant="destructive">Not Attending</Badge>
  )
}

