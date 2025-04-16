import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		// Fetch meal options (regular)
		const regularMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: false
			} as any,
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found regular meal options:', regularMealOptions)

		// Fetch meal options (children)
		const childMealOptions = await prisma.mealOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true
			} as any,
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found child meal options:', childMealOptions)

		// Fetch regular dessert options
		const regularDessertOptions = await prisma.dessertOption.findMany({
			where: { 
				isActive: true,
				isChildOption: false
			} as any,
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found regular dessert options:', regularDessertOptions)

		// Fetch child dessert options
		const childDessertOptions = await prisma.dessertOption.findMany({
			where: { 
				isActive: true,
				isChildOption: true
			} as any,
			orderBy: { createdAt: 'asc' }
		})
		console.log('Found child dessert options:', childDessertOptions)
		
		// Fetch questions
		const questions = await prisma.question.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'asc' },
			select: {
				id: true,
				question: true,
				type: true,
				options: true,
				isRequired: true
			}
		})

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
		})
	} catch (error) {
		console.error("GET form data error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch form data" },
			{ status: 500 }
		)
	}
}