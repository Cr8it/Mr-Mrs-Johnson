import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		const [
			regularMealOptions, 
			childMealOptions, 
			regularDessertOptions, 
			childDessertOptions, 
			questions
		] = await Promise.all([
			// Regular meal options
			prisma.mealOption.findMany({
				where: { 
					isActive: true,
					isChildOption: false 
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			}),
			// Child meal options
			prisma.mealOption.findMany({
				where: { 
					isActive: true,
					isChildOption: true 
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			}),
			// Regular dessert options
			prisma.dessertOption.findMany({
				where: { 
					isActive: true,
					isChildOption: false 
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			}),
			// Child dessert options
			prisma.dessertOption.findMany({
				where: { 
					isActive: true,
					isChildOption: true 
				},
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, isChildOption: true }
			}),
			// Questions
			prisma.question.findMany({
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
		])

		// Debug logs to verify options
		console.log(`Found ${regularMealOptions.length} regular meal options, ${childMealOptions.length} child meal options`);
		console.log(`Found ${regularDessertOptions.length} regular dessert options, ${childDessertOptions.length} child dessert options`);

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