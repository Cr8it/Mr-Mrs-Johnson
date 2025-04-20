import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log("DEBUG: Running options refresh check...");
    
    // Clear caches for relevant paths
    revalidatePath('/api/rsvp/options');
    revalidatePath('/api/rsvp/form-data');
    
    // 1. Check for child meal options
    const childMealOptions = await prisma.mealOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true 
      },
      select: {
        id: true,
        name: true,
        isChildOption: true,
        isActive: true
      }
    });
    
    console.log(`Found ${childMealOptions.length} child meal options: `, 
      childMealOptions.map(o => o.name).join(", "));
    
    // 2. Check for child dessert options
    const childDessertOptions = await prisma.dessertOption.findMany({
      where: { 
        isActive: true,
        isChildOption: true 
      },
      select: {
        id: true,
        name: true,
        isChildOption: true,
        isActive: true
      }
    });
    
    console.log(`Found ${childDessertOptions.length} child dessert options: `, 
      childDessertOptions.map(o => o.name).join(", "));
    
    // 3. Check API endpoint responses
    let optionsApiResponse;
    let formDataApiResponse;
    
    try {
      // Manually fetch from the options endpoint
      const optionsUrl = new URL("/api/rsvp/options", process.env.VERCEL_URL || "http://localhost:3000");
      const optionsRes = await fetch(optionsUrl.toString(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      optionsApiResponse = await optionsRes.json();
      
      // Manually fetch from the form-data endpoint
      const formDataUrl = new URL("/api/rsvp/form-data", process.env.VERCEL_URL || "http://localhost:3000");
      const formDataRes = await fetch(formDataUrl.toString(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      formDataApiResponse = await formDataRes.json();
    } catch (error) {
      console.error("Error fetching API responses:", error);
    }
    
    // Return all diagnostic info
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      diagnostics: {
        childMealOptions: {
          count: childMealOptions.length,
          items: childMealOptions
        },
        childDessertOptions: {
          count: childDessertOptions.length,
          items: childDessertOptions
        },
        optionsApiSample: optionsApiResponse ? {
          childMealOptionsCount: optionsApiResponse.childMealOptions?.length || 0,
          childDessertOptionsCount: optionsApiResponse.childDessertOptions?.length || 0
        } : "Failed to fetch",
        formDataApiSample: formDataApiResponse ? {
          childMealOptionsCount: formDataApiResponse.childMealOptions?.length || 0,
          childDessertOptionsCount: formDataApiResponse.childDessertOptions?.length || 0
        } : "Failed to fetch"
      }
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("Error in options refresh debug:", error);
    return NextResponse.json({ 
      error: "Error running options debug",
      details: error instanceof Error ? error.message : String(error)
    }, { 
      status: 500,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }
} 