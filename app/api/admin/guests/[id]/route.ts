import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		// Get guest details before deletion for activity log
		const guest = await prisma.guest.findUnique({
			where: { id: params.id },
			include: { household: true }
		})

		// Create activity log before deletion
		if (guest) {
			await prisma.guestActivity.create({
				data: {
					guestId: params.id,
					action: 'GUEST_DELETED',
					details: `Guest removed from ${guest.household.name}`
				}
			})
		}

		await prisma.guest.delete({
			where: {
				id: params.id,
			},
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error deleting guest:", error)
		return NextResponse.json(
			{ error: "Failed to delete guest" },
			{ status: 500 }
		)
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const data = await request.json()
		const { name, email, householdName, isAttending, mealChoice, dessertChoice, dietaryNotes } = data

		// Get current guest state
		const currentGuest = await prisma.guest.findUnique({
			where: { id: params.id },
			include: {
				mealChoice: true,
				dessertChoice: true,
				household: true
			}
		})

		const guest = await prisma.guest.update({
			where: { id: params.id },
			data: {
				name,
				email,
				isAttending,
				dietaryNotes,
				mealChoice: mealChoice ? { connect: { id: mealChoice.id } } : { disconnect: true },
				dessertChoice: dessertChoice ? { connect: { id: dessertChoice.id } } : { disconnect: true },
				household: {
					update: {
						name: householdName
					}
				}
			},
			include: {
				mealChoice: true,
				dessertChoice: true,
				household: true,
				responses: {
					include: {
						question: true
					}
				}
			}
		})

		// Log changes
		if (currentGuest) {
			// Log name change
			if (currentGuest.name !== name) {
				await prisma.guestActivity.create({
					data: {
						guestId: params.id,
						action: 'UPDATE_NAME',
						details: `Name updated from "${currentGuest.name}" to "${name}"`
					}
				})
			}

			// Log attendance change
			if (currentGuest.isAttending !== isAttending) {
				await prisma.guestActivity.create({
					data: {
						guestId: params.id,
						action: isAttending ? 'RSVP_YES' : 'RSVP_NO',
						details: `Admin updated attendance status to ${isAttending ? 'attending' : 'not attending'}`
					}
				})
			}

			// Log meal choice change
			if (currentGuest.mealChoice?.id !== mealChoice?.id) {
				await prisma.guestActivity.create({
					data: {
						guestId: params.id,
						action: 'UPDATE_MEAL',
						details: mealChoice ? `Admin updated meal choice to ${mealChoice.name}` : 'Meal choice removed'
					}
				})
			}

			// Log dessert choice change
			if (currentGuest.dessertChoice?.id !== dessertChoice?.id) {
				await prisma.guestActivity.create({
					data: {
						guestId: params.id,
						action: 'UPDATE_DESSERT',
						details: dessertChoice ? `Admin updated dessert choice to ${dessertChoice.name}` : 'Dessert choice removed'
					}
				})
			}
		}

		// Format response
		const formattedGuest = {
			id: guest.id,
			name: guest.name,
			email: guest.email,
			isAttending: guest.isAttending,
			mealChoice: guest.mealChoice,
			dessertChoice: guest.dessertChoice,
			dietaryNotes: guest.dietaryNotes,
			responses: guest.responses,
			household: {
				name: guest.household.name,
				code: guest.household.code
			}
		}

		return NextResponse.json(formattedGuest)
	} catch (error) {
		console.error("Error updating guest:", error)
		return NextResponse.json(
			{ error: "Failed to update guest" },
			{ status: 500 }
		)
	}
}
