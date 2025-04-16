"use client"

import { motion } from "framer-motion"
import GuestList from "../components/GuestList"
import { CsvUploadModal } from "../components/CsvUploadModal"
import TextImportModal from "../components/TextImportModal"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Clipboard, Upload, ChevronDown, PlusCircle, Plus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function GuestsPage() {
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isTextModalOpen, setIsTextModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [textImportOpen, setTextImportOpen] = useState(false)
  const [createGuestOpen, setCreateGuestOpen] = useState(false)
  const [guestCount, setGuestCount] = useState(0)

  const handleUploadSuccess = () => {
    // Refresh the guest list
    window.location.reload()
  }

  const handleGuestCountChange = (count: number) => {
    setGuestCount(count)
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800">
            <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span>{guestCount}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setUploadOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Upload CSV File</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTextImportOpen(true)}>
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Paste Spreadsheet Data</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateGuestOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GuestList onGuestCountChange={handleGuestCountChange} />
      </motion.div>
      
      <TextImportModal 
        open={textImportOpen} 
        onOpenChange={setTextImportOpen}
        onSuccess={handleUploadSuccess}
      />
      
      <CsvUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUploadSuccess}
      />
    </div>
  )
} 