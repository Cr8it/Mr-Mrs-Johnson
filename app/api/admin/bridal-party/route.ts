import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
	try {
		const members = await prisma.BridalPartyMember.findMany({
			orderBy: [
				{ type: 'asc' },
				{ order: 'asc' }
			]
		});
		return NextResponse.json(members);
	} catch (error) {
		console.error('Error fetching members:', error);
		return NextResponse.json({ error: 'Failed to fetch bridal party members' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		
		// Get max order for the specific type
		const maxOrder = await prisma.BridalPartyMember.findFirst({
			where: { type: body.type },
			orderBy: { order: 'desc' }
		});
		
		const newMember = await prisma.BridalPartyMember.create({
			data: {
				...body,
				order: maxOrder ? maxOrder.order + 1 : 1
			}
		});
		
		return NextResponse.json(newMember);
	} catch (error) {
		console.error('Error creating member:', error);
		return NextResponse.json({ error: 'Failed to create bridal party member' }, { status: 500 });
	}
}

export async function PUT(request: Request) {
	try {
		const body = await request.json();
		
		const updatedMember = await prisma.BridalPartyMember.update({
			where: { id: body.id },
			data: body
		});
		
		return NextResponse.json(updatedMember);
	} catch (error) {
		console.error('Error updating member:', error);
		return NextResponse.json({ error: 'Failed to update bridal party member' }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');
		
		if (!id) {
			return NextResponse.json({ error: 'ID is required' }, { status: 400 });
		}

		await prisma.BridalPartyMember.delete({
			where: { id }
		});
		
		return NextResponse.json({ message: 'Member deleted successfully' });
	} catch (error) {
		console.error('Error deleting member:', error);
		return NextResponse.json({ error: 'Failed to delete bridal party member' }, { status: 500 });
	}
}