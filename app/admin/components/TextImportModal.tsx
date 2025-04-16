"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clipboard, Loader2, AlertCircle, CheckCircle, Download } from "lucide-react"
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

// Sample data format for display
const SAMPLE_DATA = `Name	Email	Household	Child	Teenager
John Smith	john@example.com	Smith Family		
Jane Smith	jane@example.com	Smith Family		
Billy Smith	billy@example.com	Smith Family	yes	
Baby Smith	baby@example.com	Smith Family	yes	`;

// Add a helper comment explaining the format
const FORMAT_HELP = {
  Name: "Required. Full name of the guest",
  Household: "Required. Family or group name",
  Email: "Optional. Email address for the guest",
  Child: "Use 'yes' to mark as a child",
  Teenager: "Use 'yes' to mark as a teenager"
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
      
      // Handle case where values length doesn't match headers
      // If there are fewer values than headers, pad with empty strings
      while (values.length < headers.length) {
        values.push("")
      }
      
      // If there are more values than headers, truncate
      if (values.length > headers.length) {
        values.length = headers.length
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
    try {
      setLoading(true)
      setErrors([])
      
      // Parse the pasted data
      const records = parseTabularData(inputText)
      
      if (records.length === 0) {
        throw new Error("No valid records found in the pasted data")
      }
      
      console.log(`Parsed ${records.length} records from text input`)
      
      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        // Send the data to the server
        const response = await fetch("/api/admin/import-text-guests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guests: records.map(record => ({
              name: record.Name?.trim() || "",
              household: record.Household?.trim() || "",
              email: record.Email?.trim() || null,
              isChild: record.Child === "yes" || record.Child === "true" || record.Child === "Y" || record.Child === "C",
              isTeenager: record.Teenager === "yes" || record.Teenager === "true" || record.Teenager === "Y" || record.Teenager === "T",
              dietaryNotes: record.DietaryNotes?.trim() || null
            }))
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 504) {
            throw new Error("Server timeout. Try a smaller batch or check your data for formatting issues.")
          }
          
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.error || "Failed to import guests")
        }
        
        const result = await response.json()
        
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors)
          toast.warning(`Partially imported guests with ${result.errors.length} errors. See details below.`)
        } else {
          toast.success(`Successfully imported ${result.processed.guests} guests across ${result.processed.households} households. Processing time: ${result.processingTime}`)
          
          // Clear input and close on success
          setInputText("")
          if (onSuccess) onSuccess()
          onOpenChange(false)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error("Request timed out. Your data may be too large or complex. Try splitting it into smaller batches.")
        }
        throw error
      }
    } catch (error: unknown) {
      console.error("Import error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to import guests"
      toast.error(errorMessage)
      setErrors(errorMessage ? [errorMessage] : ["Unknown error"])
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const headers = "Name\tEmail\tHousehold\tChild\tTeenager";
    const sampleData = "John Smith\tjohn@example.com\tSmith Family\t\t\nJane Smith\tjane@example.com\tSmith Family\t\t\nBilly Smith\tbilly@example.com\tSmith Family\tyes\t\nBaby Smith\tbaby@example.com\tSmith Family\tyes\t";
    const content = `${headers}\n${sampleData}`;
    
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-import-template.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Import Guests from Text</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Paste data from Excel or other spreadsheets. Headers should include Name and Household.
            Duplicate guests (same name in the same household) will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold">Expected format (tab or comma delimited):</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                className="text-xs bg-transparent"
              >
                <Download className="mr-1 h-3 w-3" />
                Download Template
              </Button>
            </div>
            <pre className="p-2 bg-gray-100 dark:bg-gray-900 rounded-md mt-1 text-xs overflow-x-auto text-gray-800 dark:text-gray-300">
              {SAMPLE_DATA}
            </pre>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {Object.entries(FORMAT_HELP).map(([field, help]) => (
                <div key={field} className="flex flex-col bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                  <span className="font-semibold text-gray-900 dark:text-white">{field}</span>
                  <span className="text-gray-600 dark:text-gray-300">{help}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 rounded-md">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Note:</p>
              <p className="text-amber-700 dark:text-amber-400">New households will be created automatically when they don't exist in the database.</p>
              <p className="mt-1 text-amber-600 dark:text-amber-500">Duplicate guests (same name in the same household) will be skipped.</p>
            </div>
          </div>

          <Textarea
            placeholder="Paste your data here..."
            className="h-[200px] font-mono text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />

          {errors.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-400">Import Errors</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                <ul className="list-disc pl-5 text-sm mt-2 max-h-[200px] overflow-y-auto">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={loading || !inputText.trim()}
            className="bg-gold hover:bg-gold/90 text-white"
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