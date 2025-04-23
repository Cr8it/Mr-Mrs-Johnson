import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
	try {
		const households = await prisma.household.findMany({
			include: {
				guests: {
					include: {
						mealChoice: true,
						dessertChoice: true,
						responses: {
							include: {
								question: true
							}
						}
					},
					orderBy: {
						name: 'asc',
					},
				},
			},
			orderBy: {
				name: 'asc',
			},
		})

		return NextResponse.json({ households })
	} catch (error) {
		console.error("Error fetching guests:", error)
		return NextResponse.json(
			{ error: "Failed to fetch guest list" },
			{ status: 500 }
		)
	}
}

export async function POST(request: Request) {
	try {
		const { name, email, householdName, isAttending, mealChoice, dessertChoice, dietaryNotes, isChild } = await request.json()

		// Find or create household
		let household = await prisma.household.findFirst({
			where: { name: householdName }
		})

		if (!household) {
			household = await prisma.household.create({
				data: {
					name: householdName,
					code: Math.random().toString(36).substring(2, 8).toUpperCase(),
				}
			})
		}

		const guest = await prisma.guest.create({
			data: {
				name,
				email,
				isAttending,
				dietaryNotes,
				mealOptionId: mealChoice?.id,
				dessertOptionId: dessertChoice?.id,
				householdId: household.id,
				isChild: isChild === true,
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

		const formattedGuest = {
			...guest,
			household: {
				name: guest.household.name,
				code: guest.household.code
			}
		}

		return NextResponse.json(formattedGuest)
	} catch (error) {
		console.error("Error creating guest:", error)
		return NextResponse.json(
			{ error: "Failed to create guest" },
			{ status: 500 }
		)
	}
}