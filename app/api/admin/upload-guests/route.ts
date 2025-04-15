import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { unstable_noStore as noStore } from 'next/cache'
import { parse } from 'csv-parse/sync'
import { generateRandomCode } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Household } from '@prisma/client'

const TIMEOUT_MS = 120000; // 2 minute timeout
const BATCH_SIZE = 25; // Process in smaller batches

export async function POST(request: NextRequest) {
  noStore()
  
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting guest upload process')
    const startTime = Date.now()
    
    // Check if request is multipart form data
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    // Get the form data and extract the file
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Add file size check and logging
    const fileSizeInMB = file.size / (1024 * 1024)
    console.log(`Processing file of size: ${fileSizeInMB.toFixed(2)} MB`)
    
    if (fileSizeInMB > 5) {
      console.warn(`Large file detected (${fileSizeInMB.toFixed(2)} MB). This may cause timeout issues.`)
    }

    // Parse the CSV file
    const fileContent = await file.text()
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    console.log(`Parsed ${records.length} records from CSV`)
    
    // Validate and clean up records
    const validRecords = []
    const errors = []
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNum = i + 2 // +2 because row 1 is headers, and we're 0-indexed
      
      // Basic validation
      if (!record.Name || record.Name.trim() === '') {
        errors.push(`Row ${rowNum}: Missing name`)
        continue
      }
      
      if (!record.Household || record.Household.trim() === '') {
        errors.push(`Row ${rowNum}: Missing household name`)
        continue
      }
      
      // Clean up and transform record
      const cleanedRecord = {
        name: record.Name.trim(),
        household: record.Household.trim(),
        email: record.Email ? record.Email.trim() : null,
        isChild: record.Child === 'C' || false,
        isTeenager: record.Teenager === 'T' || false,
        invitation: record.Invitation || 'STANDARD',
        dietaryRequirements: record.DietaryRequirements || null
      }
      
      validRecords.push(cleanedRecord)
    }

    if (validRecords.length === 0) {
      return NextResponse.json({ 
        error: 'No valid records found in the CSV', 
        details: errors 
      }, { status: 400 })
    }

    console.log(`Found ${validRecords.length} valid records, proceeding with import`)
    
    // Track households to avoid duplicates 
    const householdMap = new Map<string, { count: number, code?: string }>()
    
    // Count guests per household first
    validRecords.forEach(record => {
      const hhName = record.household.toLowerCase()
      if (!householdMap.has(hhName)) {
        householdMap.set(hhName, { count: 1 })
      } else {
        const hh = householdMap.get(hhName)!
        hh.count += 1
        householdMap.set(hhName, hh)
      }
    })
    
    console.log(`Found ${householdMap.size} unique households`)
    
    // Process households in batches to avoid timeouts
    const householdNames = Array.from(householdMap.keys())
    const createdHouseholds: Household[] = []
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), TIMEOUT_MS)
    })
    
    // Process households in batches
    for (let i = 0; i < householdNames.length; i += BATCH_SIZE) {
      const batchStart = Date.now()
      const batch = householdNames.slice(i, i + BATCH_SIZE)
      
      console.log(`Processing household batch ${i/BATCH_SIZE + 1}/${Math.ceil(householdNames.length/BATCH_SIZE)}`)
      
      try {
        // Use Promise.race to implement timeout
        const batchHouseholds = await Promise.race([
          Promise.all(
            batch.map(async (hhName) => {
              // Generate a unique code for the household
              const code = generateRandomCode()
              
              // Create the household
              const household = await prisma.household.create({
                data: {
                  name: hhName,
                  code,
                  isActive: true
                }
              })
              
              // Update our household map with the new code
              const hh = householdMap.get(hhName)!
              hh.code = code
              householdMap.set(hhName, hh)
              
              return household
            })
          ),
          timeoutPromise
        ]) as Household[]
        
        createdHouseholds.push(...batchHouseholds)
        const batchTime = Date.now() - batchStart
        console.log(`Batch completed in ${batchTime}ms`)
        
      } catch (error) {
        console.error('Error during batch processing:', error)
        return NextResponse.json({ 
          error: 'The operation timed out. Please try with a smaller file.',
          processed: createdHouseholds.length,
          total: householdNames.length
        }, { status: 504 })
      }
    }
    
    console.log(`Created ${createdHouseholds.length} households, now creating guests`)
    
    // Now process guests in batches
    const guestCount = validRecords.length
    const createdGuests = []
    
    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      const batchStart = Date.now()
      const batch = validRecords.slice(i, i + BATCH_SIZE)
      
      console.log(`Processing guest batch ${i/BATCH_SIZE + 1}/${Math.ceil(validRecords.length/BATCH_SIZE)}`)
      
      try {
        // Use Promise.race to implement timeout
        const batchGuests = await Promise.race([
          Promise.all(
            batch.map(async (record) => {
              const hhName = record.household.toLowerCase()
              const hhDetails = householdMap.get(hhName)!
              
              // Find the household we created
              const household = await prisma.household.findFirst({
                where: {
                  name: hhName
                }
              })
              
              if (!household) {
                console.error(`Household not found: ${hhName}`)
                return null
              }
              
              // Create the guest
              const guest = await prisma.guest.create({
                data: {
                  name: record.name,
                  email: record.email,
                  isChild: record.isChild,
                  isTeenager: record.isTeenager,
                  invitation: record.invitation,
                  dietaryRequirements: record.dietaryRequirements,
                  isActive: true,
                  householdId: household.id
                }
              })
              
              return guest
            })
          ),
          timeoutPromise
        ])
        
        // Filter out any nulls (in case of errors)
        const validGuests = batchGuests.filter(g => g !== null)
        createdGuests.push(...validGuests)
        
        const batchTime = Date.now() - batchStart
        console.log(`Guest batch completed in ${batchTime}ms`)
        
      } catch (error) {
        console.error('Error during guest batch processing:', error)
        return NextResponse.json({ 
          error: 'The operation timed out while creating guests. Some households may have been created.',
          householdsCreated: createdHouseholds.length,
          guestsCreated: createdGuests.length,
          total: { households: householdNames.length, guests: validRecords.length }
        }, { status: 504 })
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Upload completed in ${totalTime}ms. Created ${createdHouseholds.length} households and ${createdGuests.length} guests.`)
    
    // Revalidate the guests page
    revalidatePath('/admin/guests')
    
    // Return success response with summary
    return NextResponse.json({ 
      message: `Successfully imported ${createdGuests.length} guests across ${createdHouseholds.length} households`,
      households: createdHouseholds,
      guests: createdGuests.length,
      processingTime: `${(totalTime/1000).toFixed(2)} seconds`
    })
    
  } catch (error: any) {
    console.error('Error in upload-guests route:', error)
    
    // Check if it's a timeout error
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({ 
        error: 'The server took too long to process the request. Please try with a smaller file.',
      }, { status: 504 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to process upload',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

