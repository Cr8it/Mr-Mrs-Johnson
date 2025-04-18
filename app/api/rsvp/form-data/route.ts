import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		// Log that we're fetching form data
		console.log('Fetching RSVP form data for meal and dessert options...');
		
		// First, get all meal options to debug
		const allMealOptions = await prisma.mealOption.findMany({
			where: { isActive: true }
		});
		console.log('ALL meal options (before filtering):', allMealOptions);
		
		// Fetch meal options (regular)
		const regularMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: false
			},
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found regular meal options:', regularMealOptions)

		// Fetch meal options (children)
		const childMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true
			},
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found child meal options:', childMealOptions)

		// Fetch all dessert options to debug
		const allDessertOptions = await prisma.dessertOption.findMany({
			where: { isActive: true }
		});
		console.log('ALL dessert options (before filtering):', allDessertOptions);
		
		// Fetch regular dessert options
		const regularDessertOptions = await prisma.dessertOption.findMany({
			where: { 
				isActive: true,
				isChildOption: false
			},
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found regular dessert options:', regularDessertOptions)

		// Fetch child dessert options
		const childDessertOptions = await prisma.dessertOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true
			},
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found child dessert options:', childDessertOptions)
		
		// Fetch questions
		const questions = await prisma.question.findMany({
			where: { isActive: true },
			orderBy: { order: 'asc' },
			select: {
				id: true,
				question: true,
				type: true,
				options: true,
				isRequired: true,
				perGuest: true,
				order: true
			}
		})
		
		console.log(`Found ${questions.length} active questions:`, 
               questions.map(q => ({ id: q.id, question: q.question, perGuest: q.perGuest })))

		// Transform questions to parse options for multiple choice questions
		const transformedQuestions = questions.map(question => ({
			...question,
			options: question.type === "MULTIPLE_CHOICE" ? 
				(() => {
					try {
						return JSON.parse(question.options)
					} catch {
						return []
					}
				})() : 
				[]
		}))

		return NextResponse.json({ 
			mealOptions: regularMealOptions, 
			childMealOptions: childMealOptions,
			dessertOptions: regularDessertOptions,
			childDessertOptions: childDessertOptions,
			questions: transformedQuestions
		}, {
			headers: {
				'Cache-Control': 'no-store, max-age=0, must-revalidate'
			}
		})
	} catch (error) {
		console.error("GET form data error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch form data" },
			{ status: 500 }
		)
	}
}