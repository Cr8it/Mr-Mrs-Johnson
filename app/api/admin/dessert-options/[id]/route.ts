import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { isActive } = await request.json()
		const option = await prisma.dessertOption.update({
			where: { id: params.id },
			data: { isActive }
		})
		return NextResponse.json({ option }, {
			headers: {
				'Cache-Control': 'no-store, max-age=0, must-revalidate'
			}
		})
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update dessert option" },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await prisma.dessertOption.delete({
			where: { id: params.id }
		})
		return NextResponse.json({ success: true }, {
			headers: {
				'Cache-Control': 'no-store, max-age=0, must-revalidate'
			}
		})
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete dessert option" },
			{ status: 500 }
		)
	}
}