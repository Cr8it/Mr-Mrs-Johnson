import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Define interfaces for our data structures
interface Child {
  id: string;
  name: string;
  isChild: boolean | null;
}

/**
 * Special utility endpoint that checks and fixes any potential issues with isChild status
 * across the system. This is useful when deployed on Vercel with Supabase.
 */
export async function GET() {
  try {
    console.log("Running comprehensive child status check and fix...")
    
    // STEP 1: Find potential children by name using Prisma queries instead of raw queries
    const potentialChildrenByName = await prisma.guest.findMany({
      where: {
        OR: [
          { name: { contains: 'child', mode: 'insensitive' } },
          { name: { contains: 'kid', mode: 'insensitive' } },
          { name: { contains: 'infant', mode: 'insensitive' } },
          { name: { contains: 'baby', mode: 'insensitive' } },
          { name: { contains: 'niyah', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        isChild: true
      }
    });
    
    // Process results to ensure consistent types
    const potentialChildren = potentialChildrenByName.map(child => ({
      id: child.id,
      name: child.name,
      isChild: child.isChild === true
    }));
    
    console.log(`Found ${potentialChildren.length} potential child records by name:`)
    console.log(JSON.stringify(potentialChildren, null, 2))
    
    // STEP 2: Fix any Niyah records in particular (known issue)
    const niyahFixes = [];
    
    for (const child of potentialChildren) {
      if (child.name.toLowerCase().includes('niyah') && !child.isChild) {
        console.log(`Fixing Niyah's child status: ${child.name}, id: ${child.id}`)
        
        try {
          // Update with standard Prisma update 
          const updatedChild = await prisma.guest.update({
            where: { id: child.id },
            data: { isChild: true },
            select: { id: true, name: true, isChild: true }
          });
          
          niyahFixes.push({
            id: child.id,
            name: child.name,
            before: child.isChild,
            after: updatedChild.isChild === true
          });
          
          // For extra safety, also run raw SQL update
          await prisma.$executeRaw`
            UPDATE "Guest" 
            SET "isChild" = true 
            WHERE id = ${child.id}
          `;
        } catch (err) {
          console.error(`Error fixing ${child.name}:`, err);
        }
      }
    }
    
    // STEP 3: Check and log meal option issues
    const mealOptionCount = await prisma.mealOption.count({
      where: { isChildOption: true }
    });
    
    const dessertOptionCount = await prisma.dessertOption.count({
      where: { isChildOption: true }
    });
    
    // STEP 4: Check child guests and their meal choices
    const childGuests = await prisma.guest.findMany({
      where: { isChild: true },
      select: {
        id: true,
        name: true,
        mealChoice: { select: { id: true, name: true, isChildOption: true } },
        dessertChoice: { select: { id: true, name: true, isChildOption: true } }
      }
    });
    
    // Format child guest choices
    const formattedChildGuests = childGuests.map(g => ({
      name: g.name,
      mealChoice: g.mealChoice ? {
        name: g.mealChoice.name,
        isChildOption: g.mealChoice.isChildOption === true
      } : null,
      dessertChoice: g.dessertChoice ? {
        name: g.dessertChoice.name,
        isChildOption: g.dessertChoice.isChildOption === true
      } : null
    }));
    
    // STEP 5: Return comprehensive report
    return NextResponse.json({
      success: true,
      report: {
        potentialChildrenCount: potentialChildren.length,
        niyahFixesApplied: niyahFixes.length,
        niyahFixDetails: niyahFixes,
        childMealOptionsCount: mealOptionCount,
        childDessertOptionsCount: dessertOptionCount,
        childGuestsCount: childGuests.length,
        childGuestsMealChoices: formattedChildGuests
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Child status check-fix error:", error);
    return NextResponse.json({
      error: "Failed to check and fix child status",
      details: error instanceof Error ? error.message : String(error)
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Surrogate-Control': 'no-store'
      }
    });
  }
} 