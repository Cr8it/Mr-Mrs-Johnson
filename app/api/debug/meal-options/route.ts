import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    console.log('DEBUG: Checking meal and dessert options in database...')
    
    // Get all meal options with their child status
    const allMealOptions = await prisma.mealOption.findMany({
      select: { 
        id: true, 
        name: true, 
        isChildOption: true,
        isActive: true,
        _count: {
          select: { guests: true }
        }
      }
    })
    
    // Get all dessert options with their child status
    const allDessertOptions = await prisma.dessertOption.findMany({
      select: { 
        id: true, 
        name: true, 
        isChildOption: true,
        isActive: true,
        _count: {
          select: { guests: true }
        }
      }
    })
    
    // Create summary
    const childMealOptions = allMealOptions.filter(o => o.isChildOption === true)
    const regularMealOptions = allMealOptions.filter(o => o.isChildOption === false)
    const childDessertOptions = allDessertOptions.filter(o => o.isChildOption === true)
    const regularDessertOptions = allDessertOptions.filter(o => o.isChildOption === false)
    
    // Check guests marked as children
    const childGuests = await prisma.guest.findMany({
      where: { isChild: true },
      select: {
        id: true,
        name: true,
        isAttending: true,
        mealChoice: {
          select: { id: true, name: true, isChildOption: true }
        },
        dessertChoice: {
          select: { id: true, name: true, isChildOption: true }
        }
      }
    })
    
    return NextResponse.json({
      summary: {
        totalMealOptions: allMealOptions.length,
        childMealOptions: childMealOptions.length,
        regularMealOptions: regularMealOptions.length,
        totalDessertOptions: allDessertOptions.length,
        childDessertOptions: childDessertOptions.length,
        regularDessertOptions: regularDessertOptions.length,
        childGuests: childGuests.length
      },
      details: {
        childMealOptions,
        regularMealOptions,
        childDessertOptions,
        regularDessertOptions,
        childGuests
      }
    })
  } catch (error) {
    console.error("DEBUG Error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve debug information" },
      { status: 500 }
    )
  }
} 