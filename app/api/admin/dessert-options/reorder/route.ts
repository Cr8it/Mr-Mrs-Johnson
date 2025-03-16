import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
	try {
		const { items } = await request.json()
		
		// Update each item's timestamp in a transaction to maintain order
		await prisma.$transaction(
			items.map((item: { id: string }, index: number) =>
				prisma.dessertOption.update({
					where: { id: item.id },
					data: { 
						// Set createdAt to maintain order, adding index to ensure unique timestamps
						createdAt: new Date(Date.now() + index) 
					}
				})
			)
		)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Reorder dessert options error:", error)
		return NextResponse.json(
			{ error: "Failed to reorder dessert options" },
			{ status: 500 }
		)
	}
}