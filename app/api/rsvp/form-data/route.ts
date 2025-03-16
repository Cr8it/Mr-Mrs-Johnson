import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		const [mealOptions, dessertOptions, questions] = await Promise.all([
			prisma.mealOption.findMany({
				where: { isActive: true },
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true }
			}),
			prisma.dessertOption.findMany({
				where: { isActive: true },
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true }
			}),
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
			mealOptions, 
			dessertOptions,
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