import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { StorageError } from '@supabase/storage-js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
	try {
		// Log environment check
		console.log('Checking Supabase configuration...');
		if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
			console.error('Missing Supabase configuration');
			return NextResponse.json({ 
				error: 'Server configuration error' 
			}, { status: 500 });
		}

		console.log('Starting file upload process...');
		const formData = await request.formData();
		const file = formData.get('file') as File;
		
		if (!file) {
			console.log('No file found in request');
			return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
		}

		console.log('File details:', {
			name: file.name,
			type: file.type,
			size: file.size
		});

		// Validate file type
		if (!ALLOWED_FILE_TYPES.includes(file.type)) {
			console.log('Invalid file type:', file.type);
			return NextResponse.json({ 
				error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
			}, { status: 400 });
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			console.log('File too large:', file.size);
			return NextResponse.json({ 
				error: 'File size too large. Maximum size is 5MB.' 
			}, { status: 400 });
		}

		console.log('Converting file to buffer...');
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Create unique filename with sanitization
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
		const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const filename = `${uniqueSuffix}-${sanitizedOriginalName}`;
		console.log('Generated filename:', filename);

		// First check if bucket exists
		console.log('Checking if bucket exists...');
		const { data: buckets, error: bucketError } = await supabaseAdmin.storage
			.listBuckets();

		if (bucketError) {
			console.error('Error checking buckets:', bucketError);
			return NextResponse.json({ 
				error: 'Failed to check storage buckets',
				details: bucketError.message
			}, { status: 500 });
		}

		const bucketExists = buckets?.some(bucket => bucket.name === 'bridal-party');
		if (!bucketExists) {
			console.log('Bucket does not exist, creating...');
			const { error: createError } = await supabaseAdmin.storage
				.createBucket('bridal-party', {
					public: true,
					fileSizeLimit: MAX_FILE_SIZE
				});

			if (createError) {
				console.error('Error creating bucket:', createError);
				return NextResponse.json({ 
					error: 'Failed to create storage bucket',
					details: createError.message
				}, { status: 500 });
			}
		}

		// Upload to Supabase Storage using admin client
		console.log('Attempting to upload to Supabase storage...');
		const { data, error } = await supabaseAdmin.storage
			.from('bridal-party')
			.upload(filename, buffer, {
				contentType: file.type,
				cacheControl: '3600',
				upsert: false
			});

		if (error) {
			console.error('Supabase storage error:', {
				message: error.message,
				error
			});
			return NextResponse.json({ 
				error: `Failed to upload file to storage: ${error.message}`
			}, { status: 500 });
		}

		console.log('File uploaded successfully, getting public URL...');
		// Get the public URL for the uploaded file
		const { data: urlData } = supabaseAdmin.storage
			.from('bridal-party')
			.getPublicUrl(filename);

		if (!urlData?.publicUrl) {
			console.error('Failed to get public URL');
			return NextResponse.json({ 
				error: 'Failed to get public URL for uploaded file' 
			}, { status: 500 });
		}

		console.log('Upload complete, returning public URL:', urlData.publicUrl);		
		return NextResponse.json({ 
			success: true,
			imageUrl: urlData.publicUrl
		});
	} catch (error: any) {
		console.error('Unhandled error during file upload:', {
			message: error.message,
			stack: error.stack,
			name: error.name,
			code: error.code,
			...(error.cause && { cause: error.cause })
		});
		return NextResponse.json({ 
			error: 'Internal server error during file upload',
			details: error.message
		}, { status: 500 });
	}
}