import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Fetch all meal options with their isChildOption status
    const allMealOptions = await prisma.mealOption.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch only child meal options
    const childMealOptions = await prisma.mealOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch only adult meal options
    const adultMealOptions = await prisma.mealOption.findMany({
      where: { 
        isActive: true,
        isChildOption: false
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      allOptions: allMealOptions,
      childOptions: childMealOptions,
      adultOptions: adultMealOptions
    });
  } catch (error) {
    console.error("Debug meal options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal options" },
      { status: 500 }
    );
  }
} 