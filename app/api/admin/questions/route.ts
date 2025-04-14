import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: {
        order: 'asc'
      }
    })
    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const question = await request.json()
    
    // Create the question with proper options handling
    const createdQuestion = await prisma.question.create({
      data: {
        question: question.question,
        type: question.type,
        // Store options as a JSON string for both MULTIPLE_CHOICE and MULTIPLE_SELECT
        options: (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT') 
          ? JSON.stringify(question.options) 
          : '',
        isRequired: question.isRequired,
        isActive: question.isActive,
        order: question.order,
        perGuest: question.perGuest || false
      }
    })

    return NextResponse.json(createdQuestion)
  } catch (error) {
    console.error("Error saving question:", error)
    return NextResponse.json(
      { error: "Failed to save question" },
      { status: 500 }
    )
  }
}

