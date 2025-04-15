import { NextResponse } from 'next/server'
import { prisma } from "@/lib/db"

// GET /api/admin/settings
export async function GET() {
	try {
		// Try to find existing settings
		const settings = await prisma.settings.findFirst()
		console.log('Found settings:', settings)

		if (settings) {
			return NextResponse.json(settings)
		}

		// If no settings exist, create default settings
		console.log('No settings found, creating default settings')
		const defaultSettings = await prisma.settings.create({
			data: {
				id: 1,
				weddingDate: null,
				venueName: '',
				venueAddress: '',
				ceremonyTime: '',
				receptionTime: '',
				primaryColor: '#d4af37',
				accentColor: '#000000',
				backgroundImage: ''
			}
		})
		console.log('Created default settings:', defaultSettings)
		return NextResponse.json(defaultSettings)

	} catch (error) {
		console.error('Error in settings GET route:', error)
		return NextResponse.json({ error: 'Failed to handle settings request' }, { status: 500 })
	}
}

// POST /api/admin/settings
export async function POST(req: Request) {
	try {
		const data = await req.json()
		console.log('Received settings data:', data)
		
		// Try to update existing settings
		const settings = await prisma.settings.update({
			where: {
				id: 1
			},
			data: {
				weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
				venueName: data.venueName || '',
				venueAddress: data.venueAddress || '',
				ceremonyTime: data.ceremonyTime || '',
				receptionTime: data.receptionTime || '',
				primaryColor: data.primaryColor || '#d4af37',
				accentColor: data.accentColor || '#000000',
				backgroundImage: data.backgroundImage || '',
				showGallery: typeof data.showGallery === 'boolean' ? data.showGallery : true
			}
		})
		console.log('Updated settings:', settings)
		return NextResponse.json(settings)

	} catch (error) {
		console.error('Error in settings POST route:', error)
		return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
	}
}
