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

		// Debug each option to verify isChildOption flag
		regularMealOptions.forEach(option => {
			console.log(`Regular meal option: ${option.name}, isChildOption=${option.isChildOption}`);
		});
		
		childMealOptions.forEach(option => {
			console.log(`Child meal option: ${option.name}, isChildOption=${option.isChildOption}`);
		});
		
		regularDessertOptions.forEach(option => {
			console.log(`Regular dessert option: ${option.name}, isChildOption=${option.isChildOption}`);
		});
		
		childDessertOptions.forEach(option => {
			console.log(`Child dessert option: ${option.name}, isChildOption=${option.isChildOption}`);
		});

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
		})
	} catch (error) {
		console.error("GET options error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch options" },
			{ status: 500 }
		)
	}
}
