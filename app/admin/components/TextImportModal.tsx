"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clipboard, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

// Sample data format for display
const SAMPLE_DATA = `Name	Household	Email	Child	Teenager	DietaryNotes
John Smith	Smith Family	john@example.com			No nuts
Jane Smith	Smith Family	jane@example.com			
Billy Smith	Smith Family		T		
Baby Smith	Smith Family	C			Allergic to dairy`;

// Add a helper comment explaining the format
const FORMAT_HELP = {
  Name: "Required. Full name of the guest",
  Household: "Required. Family or group name",
  Email: "Optional. Email address for the guest",
  Child: "Use 'C' to mark as a child",
  Teenager: "Use 'T' to mark as a teenager",
  DietaryNotes: "Optional. Any food allergies or restrictions"
};

interface TextImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface GuestRecord {
  name: string
  household: string
  email: string | null
  isChild: boolean
  isTeenager: boolean
  dietaryNotes: string | null
}

const TextImportModal: React.FC<TextImportModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const parseTabularData = (text: string) => {
    // Split the text into lines
    const lines = text.trim().split(/\r?\n/)
    
    if (lines.length < 2) {
      throw new Error("Input must have at least a header row and one data row")
    }
    
    // Parse the header row (assuming tab-delimited, but also handle comma-delimited)
    const delimiter = lines[0].includes("\t") ? "\t" : ","
    const headers = lines[0].split(delimiter).map(h => h.trim())
    
    // Check required headers
    const requiredHeaders = ["Name", "Household"]
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Required header "${required}" is missing. Headers must include: ${requiredHeaders.join(", ")}`)
      }
    }
    
    // Parse each data row
    const records: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      const values = line.split(delimiter)
      if (values.length !== headers.length) {
        throw new Error(`Row ${i} has ${values.length} columns but should have ${headers.length} columns`)
      }
      
      // Create an object with headers as keys
      const record: Record<string, string> = {}
      headers.forEach((header, index) => {
        record[header] = values[index]
      })
      
      records.push(record)
    }
    
    return records
  }

  const handleImport = async () => {
    setLoading(true)
    setErrors([])

    if (!inputText.trim()) {
      setErrors(["Please paste some data to import"])
      setLoading(false)
      return
    }

    try {
      const records = parseTabularData(inputText)
      
      if (records.length === 0) {
        throw new Error("No valid records found in the pasted data")
      }

      const response = await fetch("/api/admin/import-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ records })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to import data")
      }

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors)
        toast.warning(`Import completed with ${result.errors.length} errors. See details in the import window.`)
      } else {
        toast.success(`Import successful! Imported ${result.imported} new guests and updated ${result.updated} existing guests.`)
        if (onSuccess) onSuccess()
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error("Import error:", error)
      setErrors([error.message || "Failed to import data"])
      toast.error(`Import failed: ${error.message || "An error occurred while importing"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Guests from Text</DialogTitle>
          <DialogDescription>
            Paste data from Excel or other spreadsheets. Headers should include Name and Household.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Expected format (tab or comma delimited):</p>
            <pre className="p-2 bg-muted rounded-md mt-1 text-xs overflow-x-auto">
              {SAMPLE_DATA}
            </pre>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(FORMAT_HELP).map(([field, help]) => (
                <div key={field} className="flex flex-col">
                  <span className="font-semibold">{field}</span>
                  <span>{help}</span>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Paste your data here..."
            className="h-[200px] font-mono text-sm"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />

          {errors.length > 0 && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Import Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 text-sm mt-2 max-h-[200px] overflow-y-auto">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TextImportModal 