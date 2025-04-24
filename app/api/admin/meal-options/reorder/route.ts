import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
	try {
		const { options } = await request.json()
		
		// Validate input
		if (!options || !Array.isArray(options) || options.length === 0) {
			return NextResponse.json(
				{ error: "Invalid options data. Expected non-empty array." },
				{ status: 400 }
			)
		}
		
		// Ensure all options have an id
		const invalidOption = options.find(option => !option.id)
		if (invalidOption) {
			return NextResponse.json(
				{ error: "All options must have an id" },
				{ status: 400 }
			)
		}
		
		// Update each item's timestamp in a transaction to maintain order
		await prisma.$transaction(
			options.map((item, index) =>
				prisma.mealOption.update({
					where: { id: item.id },
					data: { 
						// Set createdAt to maintain order, adding index to ensure unique timestamps
						createdAt: new Date(Date.now() + index * 1000) 
					}
				})
			)
		)

		// Return the updated options
		const updatedOptions = await prisma.mealOption.findMany({
			orderBy: { createdAt: 'asc' }
		})

		return NextResponse.json({ 
			success: true,
			options: updatedOptions
		})
	} catch (error) {
		console.error("Reorder meal options error:", error)
		return NextResponse.json(
			{ error: "Failed to reorder meal options" },
			{ status: 500 }
		)
	}
}