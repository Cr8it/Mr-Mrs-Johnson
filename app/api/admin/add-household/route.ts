import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface GuestInput {
  name: string;
  email: string;
  mealPreference: string;
  allergies: string;
}

export async function POST(req: Request) {
  try {
    const { householdName, guests }: { householdName: string; guests: GuestInput[] } = await req.json()

    const household = await prisma.household.create({
      data: {
        name: householdName,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        guests: {
          create: guests.map((guest) => ({
            name: guest.name,
            email: guest.email || null,
            mealPreference: guest.mealPreference || null,
            allergies: guest.allergies || null,
          })),
        },
      },
      include: {
        guests: true,
      },
    })

    return NextResponse.json(household)
  } catch (error) {
    console.error("Error adding household:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add household" },
      { status: 500 }
    )
  }
}

