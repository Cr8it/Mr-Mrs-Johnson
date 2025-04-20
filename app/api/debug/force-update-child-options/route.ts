import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    console.log('DEBUG: Checking child meal and dessert options...')
    
    // Get all child meal options
    const childMealOptions = await prisma.mealOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true
      }
    })
    
    // Get all child dessert options
    const childDessertOptions = await prisma.dessertOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true
      }
    })
    
    // Get all children in the system
    const children = await prisma.guest.findMany({
      where: { isChild: true },
      include: {
        household: true,
        mealChoice: true,
        dessertChoice: true
      }
    })
    
    console.log(`Found ${childMealOptions.length} child meal options`)
    console.log(`Found ${childDessertOptions.length} child dessert options`)
    console.log(`Found ${children.length} children`)
    
    // If there are no child meal options, create some
    if (childMealOptions.length === 0) {
      console.log('Creating child meal options...')
      await prisma.mealOption.createMany({
        data: [
          { name: "Chicken Nuggets with Fries", isChildOption: true },
          { name: "Mini Pizza", isChildOption: true },
          { name: "Pasta with Tomato Sauce", isChildOption: true }
        ]
      })
    }
    
    // If there are no child dessert options, create some
    if (childDessertOptions.length === 0) {
      console.log('Creating child dessert options...')
      await prisma.dessertOption.createMany({
        data: [
          { name: "Ice Cream Sundae", isChildOption: true },
          { name: "Chocolate Brownies", isChildOption: true },
          { name: "Fruit Cup", isChildOption: true }
        ]
      })
    }
    
    // Get the updated list of options
    const updatedChildMealOptions = await prisma.mealOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true
      }
    })
    
    const updatedChildDessertOptions = await prisma.dessertOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true
      }
    })
    
    return NextResponse.json({
      before: {
        childMealOptions,
        childDessertOptions,
        children
      },
      after: {
        childMealOptions: updatedChildMealOptions,
        childDessertOptions: updatedChildDessertOptions
      }
    })
  } catch (error) {
    console.error("DEBUG Error:", error)
    return NextResponse.json(
      { error: "Failed to check/create child options" },
      { status: 500 }
    )
  }
} 