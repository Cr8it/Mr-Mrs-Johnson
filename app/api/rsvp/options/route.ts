import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Define the Option type to fix type errors
interface Option {
	id: string;
	name: string;
	isChildOption: boolean;
}

export async function GET() {
	try {
		console.log('Fetching meal and dessert options...')
		
		// Initialize variables with proper types
		let regularMealOptions: Option[] = [];
		let childMealOptions: Option[] = [];
		let regularDessertOptions: Option[] = [];
		let childDessertOptions: Option[] = [];
		
		try {
			// Fetch meal options (regular)
			regularMealOptions = await prisma.mealOption.findMany({
				where: { 
					isActive: true,
					isChildOption: false
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			})
			console.log('Found regular meal options:', regularMealOptions.length)
		} catch (error) {
			console.error("Error fetching regular meal options:", error)
			regularMealOptions = []
		}

		try {
			// Fetch meal options (children)
			childMealOptions = await prisma.mealOption.findMany({
				where: { 
					isActive: true,
					isChildOption: true
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			})
			console.log('Found child meal options:', childMealOptions.length)
		} catch (error) {
			console.error("Error fetching child meal options:", error)
			childMealOptions = []
		}

		try {
			// Fetch regular dessert options
			regularDessertOptions = await prisma.dessertOption.findMany({
				where: { 
					isActive: true,
					isChildOption: false
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			})
			console.log('Found regular dessert options:', regularDessertOptions.length)
		} catch (error) {
			console.error("Error fetching regular dessert options:", error)
			regularDessertOptions = []
		}

		try {
			// Fetch child dessert options
			childDessertOptions = await prisma.dessertOption.findMany({
				where: { 
					isActive: true,
					isChildOption: true
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			})
			console.log('Found child dessert options:', childDessertOptions.length)
		} catch (error) {
			console.error("Error fetching child dessert options:", error)
			childDessertOptions = []
		}

		// Debug summary
		console.log(`RSVP Options Summary:
		- Regular meal options: ${regularMealOptions.length}
		- Child meal options: ${childMealOptions.length}
		- Regular dessert options: ${regularDessertOptions.length}
		- Child dessert options: ${childDessertOptions.length}
		`);

		return NextResponse.json({ 
			mealOptions: regularMealOptions, 
			childMealOptions: childMealOptions,
			dessertOptions: regularDessertOptions,
			childDessertOptions: childDessertOptions
		}, {
			headers: {
				// Prevent caching to ensure fresh data
				'Cache-Control': 'no-store, max-age=0'
			}
		})
	} catch (error) {
		console.error("GET options error:", error)
		// Instead of failing with a 500, return empty arrays
		return NextResponse.json({ 
			mealOptions: [] as Option[], 
			childMealOptions: [] as Option[],
			dessertOptions: [] as Option[],
			childDessertOptions: [] as Option[],
			error: "Failed to fetch options, using empty defaults"
		}, {
			status: 200 // Return 200 instead of 500 to prevent form from breaking
		})
	}
}
