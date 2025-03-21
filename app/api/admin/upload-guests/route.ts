import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parse } from 'csv-parse/sync'

interface GuestRecord {
  name: string
  email?: string
  household: string
}

interface HouseholdGroups {
  [key: string]: GuestRecord[]
}

const validateCsvRow = (row: any): row is GuestRecord => {
  return (
    typeof row.name === "string" &&
    row.name.trim() !== "" &&
    typeof row.household === "string" &&
    row.household.trim() !== ""
  )
}

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file = data.get('file') as File
    const content = await file.text()
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true
    }) as GuestRecord[]

    // Group records by household
    const householdGroups = records.reduce<HouseholdGroups>((acc, record) => {
      if (!acc[record.household]) {
        acc[record.household] = []
      }
      acc[record.household].push(record)
      return acc
    }, {})

    // Create households and guests
    const results = await Promise.all(
      Object.entries(householdGroups).map(async ([householdName, guests]) => {
        const household = await prisma.household.create({
          data: {
            name: householdName,
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            guests: {
              create: guests.map(guest => ({
                name: guest.name,
                email: guest.email || null,
                mealChoice: null,
                dietaryNotes: null
              }))
            }
          },
          include: {
            guests: true
          }
        })
        return household
      })
    )

    return NextResponse.json({ households: results })
  } catch (error) {
    console.error("Error uploading guests:", error)
    return NextResponse.json(
      { error: "Failed to upload guest list" },
      { status: 500 }
    )
  }
}

