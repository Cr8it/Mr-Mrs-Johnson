import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function DELETE() {
  try {
    console.log("Deleting all guests and households...")
    
    // Using transactions to ensure all related data is deleted
    await prisma.$transaction([
      // Delete all question responses
      prisma.questionResponse.deleteMany({}),
      
      // Delete all guest activities
      prisma.guestActivity.deleteMany({}),
      
      // Delete all guests
      prisma.guest.deleteMany({}),
      
      // Finally delete all households
      prisma.household.deleteMany({})
    ])
    
    console.log("Successfully deleted all guests and households")
    
    return NextResponse.json({ 
      success: true,
      message: "All guests and households have been deleted" 
    })
  } catch (error) {
    console.error("Error deleting all guests:", error)
    return NextResponse.json(
      { error: "Failed to delete all guests and households" },
      { status: 500 }
    )
  }
} 