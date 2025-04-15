import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parse } from 'csv-parse/sync'

// Simple structure to represent a guest record
interface GuestRecord {
  Name: string
  Email: string | null
  Household: string
  Child: boolean
  Teenager: boolean
}

export async function POST(request: Request) {
  try {
    // Get the uploaded file
    const data = await request.formData()
    const file = data.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        error: "No file uploaded",
        message: "Please select a CSV file to upload."
      }, { status: 400 })
    }
    
    // Log basic file info
    console.log("Processing file:", file.name, file.type, file.size)
    
    // Read the file content
    const content = await file.text()
    
    // Get the first line to determine delimiter
    const firstLine = content.split('\n')[0]
    const delimiter = firstLine.includes('\t') ? '\t' : ','
    console.log(`Using ${delimiter === '\t' ? 'tab' : 'comma'} delimiter`)
    
    // Parse the CSV file
    let rawRecords
    try {
      rawRecords = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: delimiter,
        relaxColumnCount: true // Allow varying column counts
      })
      
      console.log(`Parsed ${rawRecords.length} records from file`)
    } catch (error) {
      console.error("CSV parsing error:", error)
      return NextResponse.json({
        error: "Failed to parse CSV file",
        message: "The uploaded file could not be parsed. Please ensure it's a valid CSV or Excel file exported as CSV.",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 400 })
    }
    
    // Validate and normalize records
    const errors = []
    const processedRecords = []
    
    // First, check if we have the required columns
    const firstRecord = rawRecords[0] || {}
    const headers = Object.keys(firstRecord).map(key => key.toLowerCase())
    const requiredHeaders = ['name', 'household']
    const missingHeaders = []
    
    for (const required of requiredHeaders) {
      if (!headers.some(header => header.includes(required))) {
        missingHeaders.push(required)
      }
    }
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: "Missing required columns",
        message: `Your file is missing these required columns: ${missingHeaders.join(', ')}`,
        details: {
          missingColumns: missingHeaders,
          foundColumns: headers,
          firstRow: firstRecord
        }
      }, { status: 400 })
    }
    
    // Process each record
    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i]
      const rowNumber = i + 2 // +2 for 1-based indexing and header row
      
      // Skip completely empty rows
      if (!row || Object.values(row).every(val => !val || val.toString().trim() === '')) {
        console.log(`Skipping empty row ${rowNumber}`)
        continue
      }
      
      // Get column values using case-insensitive matching
      const getValue = (key) => {
        const exactKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
        return exactKey ? row[exactKey] : null
      }
      
      // Extract values with robust fallbacks
      const name = getValue('name')?.trim()
      const email = getValue('email')?.trim() || null
      const household = getValue('household')?.trim()
      
      // Check for Child and Teenager values - accept "yes", "y", etc.
      const childValue = getValue('child')?.toString().toLowerCase().trim() || ''
      const teenValue = getValue('teenager')?.toString().toLowerCase().trim() || ''
      
      const isChild = ['yes', 'y', 'true', 't', '1'].includes(childValue)
      const isTeenager = ['yes', 'y', 'true', 't', '1'].includes(teenValue)
      
      // Validate required fields
      const rowErrors = []
      
      if (!name) {
        rowErrors.push(`Name is required`)
      }
      
      if (!household) {
        rowErrors.push(`Household is required`)
      }
      
      // Validate email format if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          rowErrors.push(`Invalid email format: "${email}"`)
        }
      }
      
      // If we have errors for this row, add them to our error list
      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          name: name || '[MISSING]',
          errors: rowErrors
        })
      } else {
        // Otherwise, add the processed record
        processedRecords.push({
          Name: name,
          Email: email,
          Household: household,
          Child: isChild,
          Teenager: isTeenager
        })
      }
    }
    
    // If we have validation errors, return them
    if (errors.length > 0) {
      console.log(`Found ${errors.length} invalid rows`)
      
      // Format errors for easy reading in the frontend
      const formattedErrors = errors.map(err => 
        `Row ${err.row} (${err.name}): ${err.errors.join(', ')}`
      ).join('\n')
      
      return NextResponse.json({
        error: "Invalid records in file",
        message: "Please fix the following issues and try again:",
        errorList: formattedErrors,
        details: errors
      }, { status: 400 })
    }
    
    // Group by household
    console.log("Grouping guests by household...")
    const householdGroups = {}
    
    for (const record of processedRecords) {
      if (!householdGroups[record.Household]) {
        householdGroups[record.Household] = []
      }
      householdGroups[record.Household].push(record)
    }
    
    console.log(`Found ${Object.keys(householdGroups).length} households with ${processedRecords.length} total guests`)
    
    // Create households and guests in database
    console.log("Creating households and guests in database...")
    const results = await Promise.all(
      Object.entries(householdGroups).map(async ([householdName, guests]) => {
        try {
          const household = await prisma.household.create({
            data: {
              name: householdName,
              // Generate a random 6-character uppercase code
              code: Math.random().toString(36).substring(2, 8).toUpperCase(),
              guests: {
                create: guests.map(guest => ({
                  name: guest.Name,
                  email: guest.Email,
                  isChild: guest.Child,
                  isTeenager: guest.Teenager
                }))
              }
            },
            include: {
              guests: true
            }
          })
          
          return household
        } catch (error) {
          console.error(`Error creating household ${householdName}:`, error)
          throw new Error(`Failed to create household "${householdName}": ${error.message}`)
        }
      })
    )
    
    // Summarize results
    const totalGuests = results.reduce((sum, household) => sum + household.guests.length, 0)
    console.log(`Successfully created ${results.length} households with ${totalGuests} guests`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${totalGuests} guests in ${results.length} households`,
      households: results.length,
      guests: totalGuests
    })
    
  } catch (error) {
    console.error("Error processing upload:", error)
    
    return NextResponse.json({
      error: "Upload failed",
      message: error.message || "An unexpected error occurred while processing your upload",
      details: error.stack
    }, { status: 500 })
  }
}

