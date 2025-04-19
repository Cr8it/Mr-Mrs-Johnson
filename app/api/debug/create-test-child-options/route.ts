import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST() {
  try {
    console.log('Creating test child meal and dessert options...')
    
    // Sample child meal options
    const childMealOptions = [
      { name: "Chicken Nuggets", isChildOption: true },
      { name: "Mini Pizza", isChildOption: true },
      { name: "Mac & Cheese", isChildOption: true }
    ]
    
    // Sample child dessert options
    const childDessertOptions = [
      { name: "Ice Cream", isChildOption: true },
      { name: "Fruit Cup", isChildOption: true },
      { name: "Chocolate Pudding", isChildOption: true }
    ]
    
    // Create the meal options
    const createdMealOptions = await Promise.all(
      childMealOptions.map(option => 
        prisma.mealOption.create({
          data: option
        })
      )
    )
    
    // Create the dessert options
    const createdDessertOptions = await Promise.all(
      childDessertOptions.map(option => 
        prisma.dessertOption.create({
          data: option
        })
      )
    )
    
    return NextResponse.json({
      success: true,
      created: {
        mealOptions: createdMealOptions,
        dessertOptions: createdDessertOptions
      }
    })
  } catch (error) {
    console.error("Error creating test options:", error)
    return NextResponse.json(
      { error: "Failed to create test options" },
      { status: 500 }
    )
  }
} 