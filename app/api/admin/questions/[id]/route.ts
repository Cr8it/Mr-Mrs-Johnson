import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		// First delete all responses for this question
		await prisma.$transaction([
			// Delete all responses for this question
			prisma.questionResponse.deleteMany({
				where: { questionId: params.id }
			}),
			// Then delete the question
			prisma.question.delete({
				where: { id: params.id }
			})
		])

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error deleting question:", error)
		return NextResponse.json(
			{ error: "Failed to delete question" },
			{ status: 500 }
		)
	}
}