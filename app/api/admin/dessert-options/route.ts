import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET() {
	try {
		console.log("Fetching dessert options...")
		const options = await prisma.dessertOption.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'asc' }  // Use createdAt instead of order
		})
		
		if (!options || options.length === 0) {
			console.log("No dessert options found")
			return NextResponse.json({ options: [] }, {
				headers: {
					'Cache-Control': 'no-store, max-age=0, must-revalidate'
				}
			})
		}

		console.log("Found dessert options:", options)
		return NextResponse.json({ options }, {
			headers: {
				'Cache-Control': 'no-store, max-age=0, must-revalidate'
			}
		})
	} catch (error) {
		console.error("GET dessert options error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch dessert options" },
			{ status: 500 }
		)
	}
}


export async function POST(request: Request) {
	try {
		const data = await request.json()

		if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
			return new Response(JSON.stringify({ error: 'Name is required' }), {
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store, max-age=0, must-revalidate'
				}
			})
		}

		// Log the incoming data
		console.log('Creating dessert option with data:', {
			name: data.name.trim(),
			isChildOption: data.isChildOption,
			isChildOptionType: typeof data.isChildOption,
			booleanValue: Boolean(data.isChildOption)
		});

		const option = await prisma.dessertOption.create({
			data: {
				name: data.name.trim(),
				isChildOption: Boolean(data.isChildOption)
			}
		})

		// Log the created option
		console.log('Created dessert option:', option);

		return new Response(JSON.stringify({ option }), {
			status: 201,
			headers: { 
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store, max-age=0, must-revalidate'
			}
		})
	} catch (error) {
		console.error('Error creating dessert option:', error)
		return new Response(JSON.stringify({ error: 'Failed to create dessert option' }), {
			status: 500,
			headers: { 
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store, max-age=0, must-revalidate'
			}
		})
	}
}

