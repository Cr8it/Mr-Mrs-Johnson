import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

		// Create unique filename with sanitization
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
		const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const filename = `${uniqueSuffix}-${sanitizedOriginalName}`;

		// Upload to Supabase Storage
		const { data, error } = await supabase.storage
			.from('bridal-party')
			.upload(filename, buffer, {
				contentType: file.type,
				cacheControl: '3600',
				upsert: false
			});

		if (error) {
			console.error('Supabase storage error:', error);
			return NextResponse.json({ 
				error: 'Failed to upload file to storage' 
			}, { status: 500 });
		}

		// Get the public URL for the uploaded file
		const { data: urlData } = supabase.storage
			.from('bridal-party')
			.getPublicUrl(filename);

		if (!urlData?.publicUrl) {
			return NextResponse.json({ 
				error: 'Failed to get public URL for uploaded file' 
			}, { status: 500 });
		}
		
		return NextResponse.json({ 
			success: true,
			imageUrl: urlData.publicUrl
		});
	} catch (error) {
		console.error('Error uploading file:', error);
		return NextResponse.json({ 
			error: 'Internal server error during file upload' 
		}, { status: 500 });
	}
}