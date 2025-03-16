import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GuestActivity } from "@prisma/client";

type ActivityWithRelations = GuestActivity & {
	guest: {
		name: string;
		household: {
			name: string;
		} | null;
	} | null;
};

export async function GET() {
	try {
		console.log("Fetching guest activities...");
		
		const activities = await prisma.guestActivity.findMany({
			include: {
				guest: {
					select: {
						name: true,
						household: {
							select: {
								name: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: "desc"
			},
			take: 100
		});

		console.log(`Found ${activities.length} activities`);

		const formattedActivities = activities
			.filter((activity: ActivityWithRelations) => {
				if (!activity.guest) {
					console.warn(`Activity ${activity.id} has no guest relation`);
					return false;
				}
				if (!activity.guest.household) {
					console.warn(`Activity ${activity.id} has no household relation`);
					return false;
				}
				return true;
			})
			.map((activity: ActivityWithRelations) => ({
				id: activity.id,
				guestId: activity.guestId,
				action: activity.action,
				details: activity.details,
				createdAt: activity.createdAt.toISOString(),
				guest: {
					name: activity.guest?.name || 'Unknown Guest',
					household: {
						name: activity.guest?.household?.name || 'Unknown Household'
					}
				}
			}));

		console.log(`Returning ${formattedActivities.length} valid activities`);
		return NextResponse.json(formattedActivities);
	} catch (error) {
		console.error("Error fetching guest activities:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to fetch guest activities" },
			{ status: 500 }
		);
	}
}