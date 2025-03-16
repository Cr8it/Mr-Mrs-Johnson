import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
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

		return NextResponse.json({ questions })
	} catch (error) {
		console.error("GET questions error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch questions" },
			{ status: 500 }
		)
	}
}