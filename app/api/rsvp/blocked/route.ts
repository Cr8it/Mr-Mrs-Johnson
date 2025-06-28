import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		const settings = await prisma.settings.findFirst()
		
		if (!settings) {
			return NextResponse.json({ rsvpBlocked: false })
		}

		return NextResponse.json({ 
			rsvpBlocked: settings.rsvpBlocked || false 
		})
	} catch (error) {
		console.error("Error checking RSVP blocked status:", error)
		return NextResponse.json({ rsvpBlocked: false })
	}
} 