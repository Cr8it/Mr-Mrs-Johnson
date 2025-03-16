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
			return NextResponse.json({ options: [] })
		}

		console.log("Found dessert options:", options)
		return NextResponse.json({ options })
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
		const body = await request.json()
		
		if (!body.name || typeof body.name !== 'string') {
			return NextResponse.json(
				{ error: "Name is required and must be a string" },
				{ status: 400 }
			)
		}

		const { name } = body
		console.log("Creating dessert option:", name)
		
		const option = await prisma.dessertOption.create({
			data: {
				name,
				isActive: true,
				updatedAt: new Date()
			}
		})
		
		console.log("Created dessert option:", option)
		return NextResponse.json({ option })
	} catch (error) {
		console.error("POST dessert option error:", error)
		return NextResponse.json(
			{ error: "Failed to create dessert option" },
			{ status: 500 }
		)
	}
}

