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
		const data = await request.json()
		
		if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
			return new Response(JSON.stringify({ error: 'Name is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		console.log(`Creating meal option: "${data.name.trim()}", isChildOption=${data.isChildOption === true}, raw value=${data.isChildOption}`);

		const option = await prisma.mealOption.create({
			data: {
				name: data.name.trim(),
				isChildOption: data.isChildOption === true
			}
		})

		console.log(`Created meal option: ${JSON.stringify(option)}`);

		return new Response(JSON.stringify({ option }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error creating meal option:', error)
		return new Response(JSON.stringify({ error: 'Failed to create meal option' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

