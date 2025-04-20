import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Special utility endpoint that checks and fixes any potential issues with isChild status
 * across the system. This is useful when deployed on Vercel with Supabase.
 */
export async function GET() {
  try {
    console.log("Running comprehensive child status check and fix...")
    
    // STEP 1: Find all potential child records by name
    const potentialChildren = await prisma.$queryRaw<{id: string, name: string, isChild: boolean | null}[]>`
      SELECT id, name, "isChild"::boolean as "isChild" 
      FROM "Guest" 
      WHERE 
        name ILIKE '%child%' OR 
        name ILIKE '%kid%' OR 
        name ILIKE '%infant%' OR 
        name ILIKE '%baby%' OR 
        name ILIKE '%niyah%'
    `
    
    console.log(`Found ${potentialChildren.length} potential child records by name:`)
    console.log(JSON.stringify(potentialChildren, null, 2))
    
    // STEP 2: Fix any Niyah records in particular (known issue)
    const niyahFixes = []
    for (const child of potentialChildren) {
      if (child.name.toLowerCase().includes('niyah') && child.isChild !== true) {
        console.log(`Fixing Niyah's child status: ${child.name}, id: ${child.id}`)
        
        // Use raw SQL update with explicit boolean casting
        await prisma.$executeRaw`
          UPDATE "Guest" 
          SET "isChild" = true::boolean 
          WHERE id = ${child.id}
        `
        
        // Also update with Prisma for consistency
        await prisma.guest.update({
          where: { id: child.id },
          data: { isChild: true }
        })
        
        // Verify the change
        const verification = await prisma.$queryRaw<{isChild: boolean}[]>`
          SELECT "isChild"::boolean as "isChild" 
          FROM "Guest" 
          WHERE id = ${child.id}
        `
        
        niyahFixes.push({
          id: child.id,
          name: child.name,
          before: child.isChild,
          after: verification[0].isChild
        })
      }
    }
    
    // STEP 3: Check and log meal option issues
    const mealOptionCount = await prisma.mealOption.count({
      where: { isChildOption: true }
    })
    
    const dessertOptionCount = await prisma.dessertOption.count({
      where: { isChildOption: true }
    })
    
    // STEP 4: Check child guests and their meal choices
    const childGuests = await prisma.guest.findMany({
      where: { isChild: true },
      select: {
        id: true,
        name: true,
        mealChoice: { select: { id: true, name: true, isChildOption: true } },
        dessertChoice: { select: { id: true, name: true, isChildOption: true } }
      }
    })
    
    // STEP 5: Return comprehensive report
    return NextResponse.json(
      {
        success: true,
        report: {
          potentialChildrenCount: potentialChildren.length,
          niyahFixesApplied: niyahFixes.length,
          niyahFixDetails: niyahFixes,
          childMealOptionsCount: mealOptionCount,
          childDessertOptionsCount: dessertOptionCount,
          childGuestsCount: childGuests.length,
          childGuestsMealChoices: childGuests.map(g => ({
            name: g.name,
            mealChoice: g.mealChoice ? {
              name: g.mealChoice.name,
              isChildOption: g.mealChoice.isChildOption
            } : null,
            dessertChoice: g.dessertChoice ? {
              name: g.dessertChoice.name,
              isChildOption: g.dessertChoice.isChildOption
            } : null
          }))
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error("Child status check-fix error:", error)
    return NextResponse.json(
      { 
        error: "Failed to check and fix child status",
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  }
} 