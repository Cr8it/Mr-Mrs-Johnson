"use client"

import { motion } from "framer-motion"
import GuestList from "../components/GuestList"
import { CsvUploadModal } from "../components/CsvUploadModal"
import TextImportModal from "../components/TextImportModal"
import { useState } from "react"
import { Button } from "../components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { FileText, Clipboard, Upload, ChevronDown, PlusCircle, Plus } from "lucide-react"
import Link from "next/link"

export default function GuestsPage() {
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isTextModalOpen, setIsTextModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [textImportOpen, setTextImportOpen] = useState(false)
  const [createGuestOpen, setCreateGuestOpen] = useState(false)

  const handleUploadSuccess = () => {
    // Refresh the guest list
    window.location.reload()
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
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
        <GuestList />
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