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

		// Fetch regular dessert options
		const regularDessertOptions = await prisma.dessertOption.findMany({
			where: { 
				isActive: true,
				isChildOption: false
			},
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true, isChildOption: true }
		})
		console.log('Found regular dessert options:', regularDessertOptions)

		// Fetch child dessert options
		const childDessertOptions = await prisma.dessertOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true
			},
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true, isChildOption: true }
		})
		console.log('Found child dessert options:', childDessertOptions)

		return NextResponse.json({ 
			mealOptions: regularMealOptions, 
			childMealOptions: childMealOptions,
			dessertOptions: regularDessertOptions,
			childDessertOptions: childDessertOptions
		})
	} catch (error) {
		console.error("GET options error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch options" },
			{ status: 500 }
		)
	}
}
