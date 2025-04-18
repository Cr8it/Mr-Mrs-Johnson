import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Check database connection and fetch questions
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    // Check for active meal options
    const mealOptions = await prisma.mealOption.findMany({
      where: { isActive: true }
    })
    
    // Check for active dessert options
    const dessertOptions = await prisma.dessertOption.findMany({
      where: { isActive: true }
    })
    
    return NextResponse.json({
      success: true,
      questionCount: questions.length,
      questions,
      mealOptionsCount: mealOptions.length,
      dessertOptionsCount: dessertOptions.length
    })
  } catch (error) {
    console.error("Debug RSVP Error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch debug data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 