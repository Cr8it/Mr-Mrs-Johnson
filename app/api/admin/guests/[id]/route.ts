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

		if (!guest) {
			return NextResponse.json(
				{ error: "Guest not found" },
				{ status: 404 }
			)
		}

		// Delete all related records first
		await prisma.$transaction([
			// Delete question responses
			prisma.questionResponse.deleteMany({
				where: { guestId: params.id }
			}),
			// Delete guest activities
			prisma.guestActivity.deleteMany({
				where: { guestId: params.id }
			}),
			// Finally delete the guest
			prisma.guest.delete({
				where: { id: params.id }
			})
		])

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
		// Validate id parameter
		if (!params.id) {
			return NextResponse.json(
				{ error: "Missing guest ID" },
				{ status: 400 }
			)
		}

		// Get and validate request data
		const data = await request.json()
		const { name, email, householdName, isAttending, mealChoice, dessertChoice, dietaryNotes, isChild } = data
		
		if (!name || !householdName) {
			return NextResponse.json(
				{ error: "Name and household name are required" },
				{ status: 400 }
			)
		}

		// Get current guest state
		const currentGuest = await prisma.guest.findUnique({
			where: { id: params.id },
			include: {
				mealChoice: true,
				dessertChoice: true,
				household: true
			}
		})

		if (!currentGuest) {
			return NextResponse.json(
				{ error: "Guest not found" },
				{ status: 404 }
			)
		}

		// Log the isChild status before the update
		console.log(`Updating guest ${name}, isChild current=${currentGuest?.isChild} (${typeof currentGuest?.isChild}), new value=${isChild} (${typeof isChild})`);

		// Create the update data with proper type handling
		const updateData = {
			name,
			email,
			isAttending,
			dietaryNotes,
			// Preserve isChild status if it's provided in the request, otherwise don't modify it
			isChild: isChild !== undefined ? isChild === true : undefined,
			// Handle meal and dessert connections properly
			mealChoice: mealChoice?.id 
				? { connect: { id: mealChoice.id } } 
				: { disconnect: true },
			dessertChoice: dessertChoice?.id 
				? { connect: { id: dessertChoice.id } } 
				: { disconnect: true },
			household: {
				update: {
					name: householdName
				}
			}
		};

		// Perform the update with error handling
		let guest;
		try {
			guest = await prisma.guest.update({
				where: { id: params.id },
				data: updateData,
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
		} catch (updateError) {
			console.error("Prisma error updating guest:", updateError);
			return NextResponse.json(
				{ 
					error: "Database error when updating guest", 
					details: updateError instanceof Error ? updateError.message : String(updateError) 
				},
				{ status: 500 }
			)
		}

		// Log changes
		try {
			if (currentGuest) {
				// Record changes in activity log
				const activities = [];
				
				// Log name change
				if (currentGuest.name !== name) {
					activities.push({
						guestId: params.id,
						action: 'UPDATE_NAME',
						details: `Name updated from "${currentGuest.name}" to "${name}"`
					});
				}

				// Log attendance change
				if (currentGuest.isAttending !== isAttending) {
					activities.push({
						guestId: params.id,
						action: isAttending ? 'RSVP_YES' : 'RSVP_NO',
						details: `Admin updated attendance status to ${isAttending ? 'attending' : 'not attending'}`
					});
				}

				// Log meal choice change
				if (currentGuest.mealChoice?.id !== mealChoice?.id) {
					activities.push({
						guestId: params.id,
						action: 'UPDATE_MEAL',
						details: mealChoice?.id ? `Admin updated meal choice to ${mealChoice.name || mealChoice.id}` : 'Meal choice removed'
					});
				}

				// Log dessert choice change
				if (currentGuest.dessertChoice?.id !== dessertChoice?.id) {
					activities.push({
						guestId: params.id,
						action: 'UPDATE_DESSERT',
						details: dessertChoice?.id ? `Admin updated dessert choice to ${dessertChoice.name || dessertChoice.id}` : 'Dessert choice removed'
					});
				}

				// Log isChild change if it was changed
				if (isChild !== undefined && currentGuest.isChild !== isChild) {
					activities.push({
						guestId: params.id,
						action: 'UPDATE_CHILD_STATUS',
						details: `Admin updated child status from ${currentGuest.isChild} to ${isChild}`
					});
				}
				
				// Create all activities in a batch if there are any
				if (activities.length > 0) {
					await prisma.guestActivity.createMany({
						data: activities
					});
				}
			}
		} catch (logError) {
			// Don't fail the update if activity logging fails
			console.error("Error logging guest activities:", logError);
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
			isChild: guest.isChild,
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
			{ 
				error: "Failed to update guest", 
				details: error instanceof Error ? error.message : String(error) 
			},
			{ status: 500 }
		)
	}
}
