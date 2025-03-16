import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET() {
	try {
		console.log("Fetching meal options...")
		const options = await prisma.mealOption.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'asc' }  // Use createdAt instead of order
		})
		
		if (!options || options.length === 0) {
			console.log("No meal options found")
			return NextResponse.json({ options: [] })
		}

		console.log("Found meal options:", options)
		return NextResponse.json({ options })
	} catch (error) {
		console.error("GET meal options error:", error)
		return NextResponse.json(
			{ error: "Failed to fetch meal options" },
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
		console.log("Creating meal option:", name)
		
		const option = await prisma.mealOption.create({
			data: {
				name,
				isActive: true,
				updatedAt: new Date()
			}
		})
		
		console.log("Created meal option:", option)
		return NextResponse.json({ option })
	} catch (error) {
		console.error("POST meal option error:", error)
		return NextResponse.json(
			{ error: "Failed to create meal option" },
			{ status: 500 }
		)
	}
}

