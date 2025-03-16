import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { isActive } = await request.json()
		const option = await prisma.mealOption.update({
			where: { id: params.id },
			data: { isActive }
		})
		return NextResponse.json({ option })
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update meal option" },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await prisma.mealOption.delete({
			where: { id: params.id }
		})
		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete meal option" },
			{ status: 500 }
		)
	}
}