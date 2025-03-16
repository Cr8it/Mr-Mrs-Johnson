import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Assuming you have a way to identify the user, e.g., session or token
    const userId = "some-user-id" // Replace with actual user identification logic

    const household = await prisma.household.findFirst({
      where: {
        guests: {
          some: {
            id: userId,
            isAttending: true // Check if any guest is attending
          }
        }
      }
    })

    return NextResponse.json({ isConfirmed: !!household })
  } catch (error) {
    console.error("Error checking RSVP status:", error)
    return NextResponse.json({ error: "Failed to check RSVP status" }, { status: 500 })
  }
} 