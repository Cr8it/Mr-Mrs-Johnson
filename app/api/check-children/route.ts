import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get all guests that are marked as children, 
    // plus any guests with "child" in their name for verification
    const [markedChildren, potentialChildren] = await Promise.all([
      // Get guests explicitly marked as children in database
      prisma.guest.findMany({
        where: {
          isChild: true
        },
        select: {
          id: true,
          name: true,
          isChild: true,
          household: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      }),
      
      // Get any guest with "child", "kid", etc. in their name
      // that isn't already marked as a child
      prisma.guest.findMany({
        where: {
          OR: [
            { name: { contains: "child", mode: "insensitive" } },
            { name: { contains: "kid", mode: "insensitive" } },
            { name: { contains: "infant", mode: "insensitive" } },
            { name: { contains: "baby", mode: "insensitive" } },
            { name: { contains: "niyah", mode: "insensitive" } }, // Special case
          ],
          isChild: false // Only get those not already marked
        },
        select: {
          id: true,
          name: true,
          isChild: true,
          household: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      })
    ])
    
    // Format the results
    const formattedMarkedChildren = markedChildren.map(child => ({
      id: child.id,
      name: child.name,
      isChild: child.isChild === true, // Force boolean
      householdName: child.household.name,
      householdCode: child.household.code
    }))
    
    const formattedPotentialChildren = potentialChildren.map(child => ({
      id: child.id,
      name: child.name,
      isChild: child.isChild === true, // Force boolean
      householdName: child.household.name,
      householdCode: child.household.code
    }))
    
    // Combine and sort by household and then name
    const allChildren = [
      ...formattedMarkedChildren,
      ...formattedPotentialChildren
    ].sort((a, b) => {
      if (a.householdName !== b.householdName) {
        return a.householdName.localeCompare(b.householdName)
      }
      return a.name.localeCompare(b.name)
    })
    
    console.log(`Found ${markedChildren.length} marked children and ${potentialChildren.length} potential children`)
    
    return NextResponse.json({
      children: allChildren,
      stats: {
        markedCount: markedChildren.length,
        potentialCount: potentialChildren.length
      }
    })
  } catch (error) {
    console.error("Error checking children:", error)
    return NextResponse.json(
      { error: "Failed to check children" },
      { status: 500 }
    )
  }
} 