import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Define interfaces for our option types
interface MealOption {
	id: string;
	name: string;
	isChildOption: boolean;
}

interface DessertOption {
	id: string;
	name: string;
	isChildOption: boolean;
}

export async function GET() {
	try {
		console.log("Fetching meal and dessert options...")
		
		// Use standard Prisma queries instead of raw queries to avoid type issues
		const [regularMealOptions, childMealOptions, regularDessertOptions, childDessertOptions] = 
			await Promise.all([
				// Regular meal options
				prisma.mealOption.findMany({
					where: { 
						isActive: true,
						isChildOption: false
					},
					orderBy: { createdAt: 'asc' },
					select: { 
						id: true, 
						name: true, 
						isChildOption: true 
					}
				}),
				
				// Child meal options
				prisma.mealOption.findMany({
					where: { 
						isActive: true,
						isChildOption: true
					},
					orderBy: { createdAt: 'asc' },
					select: { 
						id: true, 
						name: true, 
						isChildOption: true 
					}
				}),
				
				// Regular dessert options
				prisma.dessertOption.findMany({
					where: { 
						isActive: true,
						isChildOption: false
					},
					orderBy: { createdAt: 'asc' },
					select: { 
						id: true, 
						name: true, 
						isChildOption: true 
					}
				}),
				
				// Child dessert options
				prisma.dessertOption.findMany({
					where: { 
						isActive: true,
						isChildOption: true
					},
					orderBy: { createdAt: 'asc' },
					select: { 
						id: true, 
						name: true, 
						isChildOption: true 
					}
				})
			]);
		
		// For child meal options, ensure we're handling them consistently by explicitly forcing booleans
		const processedRegularMealOptions = regularMealOptions.map(option => ({
			...option,
			isChildOption: option.isChildOption === true
		}));
		
		const processedChildMealOptions = childMealOptions.map(option => ({
			...option,
			isChildOption: option.isChildOption === true
		}));
		
		const processedRegularDessertOptions = regularDessertOptions.map(option => ({
			...option,
			isChildOption: option.isChildOption === true
		}));
		
		const processedChildDessertOptions = childDessertOptions.map(option => ({
			...option,
			isChildOption: option.isChildOption === true
		}));
		
		// Add detailed logging
		console.log(`Found ${processedRegularMealOptions.length} regular meal options`);
		console.log(`Found ${processedChildMealOptions.length} child meal options`);
		console.log(`Found ${processedRegularDessertOptions.length} regular dessert options`);
		console.log(`Found ${processedChildDessertOptions.length} child dessert options`);
		
		// Special case: Check for child meal options and log warning if none found
		if (processedChildMealOptions.length === 0) {
			console.log("WARNING: No child meal options found! This might be a problem for child guests.");
			
			// Check if any exist at all, even inactive
			const anyChildMeals = await prisma.mealOption.findFirst({
				where: { isChildOption: true },
				select: { id: true, name: true, isActive: true, isChildOption: true }
			});
			
			console.log(`Any child meals exist in database?`, anyChildMeals);
			
			// If none exist, try to create some default ones for child guests
			if (!anyChildMeals) {
				console.log("No child meal options found at all. Consider creating some for child guests.");
			}
		}
		
		// Also perform a direct database check with raw SQL to verify the isChildOption values
		// but don't use the results for type-checked code
		prisma.$executeRaw`
			SELECT id, name, "isChildOption"::boolean as "isChildOption"
			FROM "MealOption" 
			WHERE "isActive" = true AND "isChildOption" = true
		`.then((result) => {
			console.log(`Raw SQL verification for child meal options:`, result);
		}).catch(err => {
			console.error("Raw SQL verification error:", err);
		});
		
		// Return response with processed options and no-cache headers
		return NextResponse.json(
			{
				mealOptions: processedRegularMealOptions,
				childMealOptions: processedChildMealOptions,
				dessertOptions: processedRegularDessertOptions,
				childDessertOptions: processedChildDessertOptions
			},
			{
				headers: {
					'Cache-Control': 'no-store, max-age=0',
					'Surrogate-Control': 'no-store' 
				}
			}
		);
	} catch (error) {
		console.error("Error fetching options:", error);
		return NextResponse.json(
			{ error: "Failed to fetch options" },
			{ 
				status: 500,
				headers: {
					'Cache-Control': 'no-store, max-age=0',
					'Surrogate-Control': 'no-store'
				}
			}
		);
	}
}
