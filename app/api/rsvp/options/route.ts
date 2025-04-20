import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		console.log("Fetching meal and dessert options...")
		
		// Use raw queries with explicit boolean casting for more reliable results
		const [
			regularMealOptions, 
			childMealOptions, 
			regularDessertOptions, 
			childDessertOptions
		] = await Promise.all([
			// Regular meal options - using raw query with explicit boolean casting
			prisma.$queryRaw`
				SELECT id, name, "isChildOption"::boolean as "isChildOption" 
				FROM "MealOption" 
				WHERE "isActive" = true AND "isChildOption" = false
				ORDER BY "createdAt" ASC
			`,
			// Child meal options - using raw query with explicit boolean casting
			prisma.$queryRaw`
				SELECT id, name, "isChildOption"::boolean as "isChildOption" 
				FROM "MealOption" 
				WHERE "isActive" = true AND "isChildOption" = true
				ORDER BY "createdAt" ASC
			`,
			// Regular dessert options - using raw query with explicit boolean casting
			prisma.$queryRaw`
				SELECT id, name, "isChildOption"::boolean as "isChildOption" 
				FROM "DessertOption" 
				WHERE "isActive" = true AND "isChildOption" = false
				ORDER BY "createdAt" ASC
			`,
			// Child dessert options - using raw query with explicit boolean casting
			prisma.$queryRaw`
				SELECT id, name, "isChildOption"::boolean as "isChildOption" 
				FROM "DessertOption" 
				WHERE "isActive" = true AND "isChildOption" = true
				ORDER BY "createdAt" ASC
			`
		])
		
		// Add detailed logging
		console.log(`Found ${regularMealOptions.length} regular meal options`)
		console.log(`Found ${childMealOptions.length} child meal options`)
		console.log(`Found ${regularDessertOptions.length} regular dessert options`)
		console.log(`Found ${childDessertOptions.length} child dessert options`)
		
		// Log a sample of each for debugging
		if (regularMealOptions.length > 0) {
			console.log(`Regular meal option sample:`, regularMealOptions[0])
		}
		
		if (childMealOptions.length > 0) {
			console.log(`Child meal option sample:`, childMealOptions[0])
		} else {
			console.log(`WARNING: No child meal options found! This might be a problem for child guests.`)
			// Check if any exist at all, even inactive
			const anyChildMeals = await prisma.mealOption.findFirst({
				where: { isChildOption: true },
				select: { id: true, name: true, isActive: true, isChildOption: true }
			})
			console.log(`Any child meals exist in database?`, anyChildMeals)
		}
		
		// Regular Prisma queries as backup
		const prismaChildMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true 
			},
			select: { 
				id: true, 
				name: true, 
				isChildOption: true 
			}
		})
		
		console.log(`Prisma child meal options count: ${prismaChildMealOptions.length}`)
		console.log(`Prisma child meal options:`, prismaChildMealOptions)
		
		return NextResponse.json(
			{
				mealOptions: regularMealOptions,
				childMealOptions: childMealOptions,
				dessertOptions: regularDessertOptions,
				childDessertOptions: childDessertOptions,
				debugBackup: {
					prismaChildMealOptions
				}
			},
			{
				headers: {
					'Cache-Control': 'no-store, max-age=0',
					'Surrogate-Control': 'no-store' 
				}
			}
		)
	} catch (error) {
		console.error("Error fetching options:", error)
		return NextResponse.json(
			{ error: "Failed to fetch options" },
			{ 
				status: 500,
				headers: {
					'Cache-Control': 'no-store, max-age=0',
					'Surrogate-Control': 'no-store'
				}
			}
		)
	}
}
