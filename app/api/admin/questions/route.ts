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
    const body = await request.json()
    
    // Check if the body is an array (bulk update) or a single question
    if (Array.isArray(body)) {
      // Handle bulk update (delete all existing questions and create new ones)
      await prisma.question.deleteMany()
      
      // Create all questions in a transaction
      const createdQuestions = await prisma.$transaction(
        body.map((question: any) => 
          prisma.question.create({
            data: {
              question: question.question,
              type: question.type,
              // Store options as a JSON string for both MULTIPLE_CHOICE and MULTIPLE_SELECT
              options: (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT') 
                ? JSON.stringify(question.options) 
                : '',
              isRequired: question.isRequired,
              isActive: question.isActive || true,
              order: question.order,
              perGuest: question.perGuest || false
            }
          })
        )
      )
      
      return NextResponse.json(createdQuestions)
    } else {
      // Handle single question creation
      const question = body
      const createdQuestion = await prisma.question.create({
        data: {
          question: question.question,
          type: question.type,
          // Store options as a JSON string for both MULTIPLE_CHOICE and MULTIPLE_SELECT
          options: (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT') 
            ? JSON.stringify(question.options) 
            : '',
          isRequired: question.isRequired,
          isActive: question.isActive || true,
          order: question.order,
          perGuest: question.perGuest || false
        }
      })
      
      return NextResponse.json(createdQuestion)
    }
  } catch (error) {
    console.error("Error saving question(s):", error)
    return NextResponse.json(
      { error: "Failed to save question(s)" },
      { status: 500 }
    )
  }
}

