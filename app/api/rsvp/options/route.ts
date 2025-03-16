import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		console.log('Fetching meal and dessert options...')
		
		// Fetch meal options
		const mealOptions = await prisma.mealOption.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true }
		})
		console.log('Found meal options:', mealOptions)

		// Fetch dessert options
		const dessertOptions = await prisma.dessertOption.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true }
		})
		console.log('Found dessert options:', dessertOptions)

		return NextResponse.json({ 
			mealOptions, 
			dessertOptions 
		})
	} catch (error) {
		console.error("GET options error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch options" },
			{ status: 500 }
		)
	}
}
