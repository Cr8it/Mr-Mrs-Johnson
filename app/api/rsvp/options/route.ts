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

		// Create default child options if none exist
		let updatedChildMealOptions = childMealOptions;
		let updatedChildDessertOptions = childDessertOptions;

		// If no child meal options exist, create some
		if (childMealOptions.length === 0) {
			console.log('No child meal options found, creating defaults...');
			
			// Create default child meal options
			const defaultChildMealOptions = await Promise.all([
				prisma.mealOption.create({
					data: {
						name: "Chicken Nuggets with Fries",
						isChildOption: true,
						isActive: true
					},
					select: { id: true, name: true, isChildOption: true }
				}),
				prisma.mealOption.create({
					data: {
						name: "Mini Pizza",
						isChildOption: true,
						isActive: true
					},
					select: { id: true, name: true, isChildOption: true }
				}),
				prisma.mealOption.create({
					data: {
						name: "Pasta with Tomato Sauce",
						isChildOption: true,
						isActive: true
					},
					select: { id: true, name: true, isChildOption: true }
				})
			]);
			
			updatedChildMealOptions = defaultChildMealOptions;
			console.log('Created default child meal options:', defaultChildMealOptions);
		}

		// If no child dessert options exist, create some
		if (childDessertOptions.length === 0) {
			console.log('No child dessert options found, creating defaults...');
			
			// Create default child dessert options
			const defaultChildDessertOptions = await Promise.all([
				prisma.dessertOption.create({
					data: {
						name: "Ice Cream Sundae",
						isChildOption: true,
						isActive: true
					},
					select: { id: true, name: true, isChildOption: true }
				}),
				prisma.dessertOption.create({
					data: {
						name: "Chocolate Brownie",
						isChildOption: true,
						isActive: true
					},
					select: { id: true, name: true, isChildOption: true }
				}),
				prisma.dessertOption.create({
					data: {
						name: "Fruit Cup",
						isChildOption: true,
						isActive: true
					},
					select: { id: true, name: true, isChildOption: true }
				})
			]);
			
			updatedChildDessertOptions = defaultChildDessertOptions;
			console.log('Created default child dessert options:', defaultChildDessertOptions);
		}

		// Debug each option to verify isChildOption flag
		regularMealOptions.forEach(option => {
			console.log(`Regular meal option: ${option.name}, isChildOption=${option.isChildOption}`);
		});
		
		updatedChildMealOptions.forEach(option => {
			console.log(`Child meal option: ${option.name}, isChildOption=${option.isChildOption}`);
		});
		
		regularDessertOptions.forEach(option => {
			console.log(`Regular dessert option: ${option.name}, isChildOption=${option.isChildOption}`);
		});
		
		updatedChildDessertOptions.forEach(option => {
			console.log(`Child dessert option: ${option.name}, isChildOption=${option.isChildOption}`);
		});

		// Debug summary
		console.log(`RSVP Options Summary:
		- Regular meal options: ${regularMealOptions.length}
		- Child meal options: ${updatedChildMealOptions.length}
		- Regular dessert options: ${regularDessertOptions.length}
		- Child dessert options: ${updatedChildDessertOptions.length}
		`);

		return NextResponse.json({ 
			mealOptions: regularMealOptions, 
			childMealOptions: updatedChildMealOptions,
			dessertOptions: regularDessertOptions,
			childDessertOptions: updatedChildDessertOptions
		})
	} catch (error) {
		console.error("GET options error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch options" },
			{ status: 500 }
		)
	}
}
