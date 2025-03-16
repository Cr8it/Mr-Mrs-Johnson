import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface MemberOrder {
	id: string;
	order: number;
	type: string;
}

export async function POST(request: Request) {
	try {
		const { members } = await request.json() as { members: MemberOrder[] };
		
		// Update all members in a transaction
		await prisma.$transaction(
			members.map(member => 
				prisma.BridalPartyMember.update({
					where: { id: member.id },
					data: { order: member.order }
				})
			)
		);

		// Fetch and return updated members
		const updatedMembers = await prisma.BridalPartyMember.findMany({
			where: {
				id: {
					in: members.map(m => m.id)
				}
			},
			orderBy: [
				{ type: 'asc' },
				{ order: 'asc' }
			]
		});
		
		return NextResponse.json({ 
			success: true, 
			members: updatedMembers 
		});
	} catch (error) {
		console.error('Error reordering members:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to reorder members' },
			{ status: 500 }
		);
	}
}
