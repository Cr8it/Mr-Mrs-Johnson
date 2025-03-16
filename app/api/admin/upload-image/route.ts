import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		
		if (!file) {
			return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
		}

		// Validate file type
		if (!ALLOWED_FILE_TYPES.includes(file.type)) {
			return NextResponse.json({ 
				error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
			}, { status: 400 });
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json({ 
				error: 'File size too large. Maximum size is 5MB.' 
			}, { status: 400 });
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Create unique filename
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
		const filename = `${uniqueSuffix}-${file.name}`;
		const path = join(process.cwd(), 'public', 'uploads', filename);

		// Write the file
		await writeFile(path, buffer);
		
		return NextResponse.json({ 
			success: true,
			imageUrl: `/uploads/${filename}`
		});
	} catch (error) {
		console.error('Error uploading file:', error);
		return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
	}
}