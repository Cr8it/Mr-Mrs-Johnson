import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
	try {
		const members = await prisma.bridalPartyMember.findMany({
			orderBy: [
				{ type: 'asc' },
				{ order: 'asc' }
			]
		});
		return NextResponse.json(members);
	} catch (error) {
		console.error('Error fetching bridal party:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch bridal party' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const data = await request.json();
		const member = await prisma.bridalPartyMember.create({
			data: {
				...data,
				order: data.order || 0
			}
		});
		return NextResponse.json(member);
	} catch (error) {
		console.error('Error creating member:', error);
		return NextResponse.json(
			{ error: 'Failed to create member' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const data = await request.json();
		const { id, ...updateData } = data;
		const member = await prisma.bridalPartyMember.update({
			where: { id },
			data: updateData
		});
		return NextResponse.json(member);
	} catch (error) {
		console.error('Error updating member:', error);
		return NextResponse.json(
			{ error: 'Failed to update member' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');
		if (!id) {
			return NextResponse.json(
				{ error: 'Member ID is required' },
				{ status: 400 }
			);
		}
		await prisma.bridalPartyMember.delete({
			where: { id }
		});
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting member:', error);
		return NextResponse.json(
			{ error: 'Failed to delete member' },
			{ status: 500 }
		);
	}
}