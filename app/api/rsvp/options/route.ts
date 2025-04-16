import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		console.log('Fetching meal and dessert options...')
		
		// Fetch meal options (regular)
		const regularMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: false
			},
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true, isChildOption: true }
		})
		console.log('Found regular meal options:', regularMealOptions)

		// Fetch meal options (children)
		const childMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true
			},
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true, isChildOption: true }
		})
		console.log('Found child meal options:', childMealOptions)

		// Fetch dessert options
		const dessertOptions = await prisma.dessertOption.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true }
		})
		console.log('Found dessert options:', dessertOptions)

		return NextResponse.json({ 
			mealOptions: regularMealOptions, 
			childMealOptions: childMealOptions,
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
