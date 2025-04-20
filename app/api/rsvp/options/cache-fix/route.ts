import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint to fix the RSVP options cache and return the current state of meal and dessert options
 */
export async function GET() {
  try {
    console.log("Running RSVP options cache fix...")
    
    // Revalidate any related paths to ensure cache is cleared
    revalidatePath('/api/rsvp/options');
    revalidatePath('/api/rsvp/form-data');
    
    // Get all meal options with direct database query to avoid any potential caching
    const [regularMealOptions, childMealOptions, regularDessertOptions, childDessertOptions] = 
      await Promise.all([
        // Regular meal options
        prisma.mealOption.findMany({
          where: { 
            isActive: true,
            isChildOption: false
          },
          select: { 
            id: true, 
            name: true, 
            isChildOption: true,
            isActive: true,
            createdAt: true 
          }
        }),
        
        // Child meal options
        prisma.mealOption.findMany({
          where: { 
            isActive: true,
            isChildOption: true
          },
          select: { 
            id: true, 
            name: true, 
            isChildOption: true,
            isActive: true,
            createdAt: true
          }
        }),
        
        // Regular dessert options
        prisma.dessertOption.findMany({
          where: { 
            isActive: true,
            isChildOption: false
          },
          select: { 
            id: true, 
            name: true, 
            isChildOption: true,
            isActive: true,
            createdAt: true
          }
        }),
        
        // Child dessert options
        prisma.dessertOption.findMany({
          where: { 
            isActive: true,
            isChildOption: true
          },
          select: { 
            id: true, 
            name: true, 
            isChildOption: true,
            isActive: true,
            createdAt: true
          }
        })
      ]);
    
    // Log the counts to verify
    console.log(`Found ${regularMealOptions.length} regular meal options`);
    console.log(`Found ${childMealOptions.length} child meal options`);
    console.log(`Found ${regularDessertOptions.length} regular dessert options`);
    console.log(`Found ${childDessertOptions.length} child dessert options`);
    
    // Update the main options cache by making an actual request to the options endpoint
    // This ensures that both this endpoint and the actual endpoint reflect the same data
    console.log("Refreshing options endpoint cache...");
    try {
      const optionsUrl = new URL("/api/rsvp/options", process.env.VERCEL_URL || "http://localhost:3000");
      await fetch(optionsUrl.toString(), {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
    } catch (refreshError) {
      console.error("Error refreshing options cache:", refreshError);
    }
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        cacheCleared: true,
        options: {
          mealOptions: regularMealOptions,
          childMealOptions: childMealOptions,
          dessertOptions: regularDessertOptions,
          childDessertOptions: childDessertOptions
        },
        counts: {
          regularMealOptions: regularMealOptions.length,
          childMealOptions: childMealOptions.length,
          regularDessertOptions: regularDessertOptions.length,
          childDessertOptions: childDessertOptions.length
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Surrogate-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error("RSVP options cache fix error:", error);
    
    return NextResponse.json(
      {
        error: "Failed to fix RSVP options cache",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate'
        }
      }
    );
  }
} 