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
    const questions = await request.json()
    
    // Delete all existing questions first
    await prisma.question.deleteMany()
    
    // Create all questions in a transaction
    await prisma.$transaction(
      questions.map((question: any) => 
      prisma.question.create({
        data: {
          question: question.question,
          type: question.type,
          // Store options as a JSON string if they exist
          options: question.type === 'MULTIPLE_CHOICE' ? JSON.stringify(question.options) : '',
          isRequired: question.isRequired,
          isActive: question.isActive,
          order: question.order,
          perGuest: question.perGuest || false
        }
      })
      )
    )

    const updatedQuestions = await prisma.question.findMany({
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(updatedQuestions)
  } catch (error) {
    console.error("Error saving questions:", error)
    return NextResponse.json(
      { error: "Failed to save questions" },
      { status: 500 }
    )
  }
}

