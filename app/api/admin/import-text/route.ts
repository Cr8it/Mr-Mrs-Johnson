import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import logger from '@/lib/logger'

const prismaClient = new PrismaClient();

// Define the schema for guest records
const GuestRecordSchema = z.object({
  name: z.string().min(1, "Name is required"),
  household: z.string().min(1, "Household is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(["GUEST", "ADMIN"]).default("GUEST"),
  isChild: z.boolean().default(false),
  isTeenager: z.boolean().default(false),
  rsvpStatus: z.enum(["PENDING", "ATTENDING", "DECLINED"]).default("PENDING"),
  dietaryRestrictions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Expected headers for the text data
const EXPECTED_HEADERS = [
  'Name',
  'Household',
  'Email',
  'Phone',
  'Attending',
  'Adult',
  'Teenager',
  'Child',
  'Meal Option',
  'Dessert Option',
  'Notes'
]

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { records } = await request.json()

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records provided' },
        { status: 400 }
      )
    }

    logger.info(`Processing ${records.length} records from text import`)

    const importErrors: string[] = []
    let importedCount = 0
    let updatedCount = 0

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // +2 because we're 0-indexed but users think in 1-indexed, and we skip the header row

      try {
        // Basic validation
        if (!record.Name?.trim()) {
          importErrors.push(`Row ${rowNumber}: Name is required`)
          continue
        }

        if (!record.Household?.trim()) {
          importErrors.push(`Row ${rowNumber}: Household is required`)
          continue
        }

        // Check if household exists, create if not
        let household = await prisma.household.findFirst({
          where: {
            name: {
              equals: record.Household.trim(),
              mode: 'insensitive'
            }
          }
        })

        if (!household) {
          household = await prisma.household.create({
            data: {
              name: record.Household.trim(),
              code: generateRandomCode()
            }
          })
          logger.info(`Created new household: ${household.name} with code ${household.code}`)
        }

        // Check if guest exists
        const existingGuest = await prisma.guest.findFirst({
          where: {
            name: {
              equals: record.Name.trim(),
              mode: 'insensitive'
            },
            householdId: household.id
          }
        })

        // Determine if child or teenager
        const isChild = record.Child === 'C' || 
                       record.Child === 'c' || 
                       record.Child === 'true' || 
                       record.Child === 'yes' || 
                       record.Child === '1';
                       
        const isTeenager = record.Teenager === 'T' || 
                          record.Teenager === 't' || 
                          record.Teenager === 'true' || 
                          record.Teenager === 'yes' || 
                          record.Teenager === '1';

        // Create or update guest
        if (existingGuest) {
          await prisma.guest.update({
            where: { id: existingGuest.id },
            data: {
              email: record.Email ? record.Email.trim() : existingGuest.email,
              isChild: isChild,
              isTeenager: isTeenager,
              dietaryNotes: record.DietaryNotes ? record.DietaryNotes.trim() : existingGuest.dietaryNotes
            }
          })
          updatedCount++
        } else {
          await prisma.guest.create({
            data: {
              name: record.Name.trim(),
              householdId: household.id,
              email: record.Email ? record.Email.trim() : null,
              isChild: isChild,
              isTeenager: isTeenager,
              dietaryNotes: record.DietaryNotes ? record.DietaryNotes.trim() : null
            }
          })
          importedCount++
        }
      } catch (error) {
        logger.error(`Error processing row ${rowNumber}:`, error)
        importErrors.push(`Row ${rowNumber}: ${error.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      errors: importErrors
    })
  } catch (error) {
    logger.error('Text import error:', error)
    return NextResponse.json(
      { error: 'Failed to process import: ' + error.message },
      { status: 500 }
    )
  }
} 