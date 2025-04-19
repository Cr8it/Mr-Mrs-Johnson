import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json()
    const { code, guestUpdates } = body
    
    if (!code) {
      return NextResponse.json({ error: "Missing household code" }, { status: 400 })
    }
    
    if (!guestUpdates || !Array.isArray(guestUpdates) || guestUpdates.length === 0) {
      return NextResponse.json({ error: "Missing or invalid guest updates" }, { status: 400 })
    }
    
    console.log(`DEBUG: Fixing children for household with code: ${code}`)
    console.log(`Updates to apply:`, guestUpdates)
    
    // Get the household to make sure it exists
    const household = await prisma.household.findFirst({
      where: { code },
      select: { id: true, name: true }
    })
    
    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }
    
    // Apply each update one by one so we can track success/failure
    const results = []
    
    for (const update of guestUpdates) {
      try {
        const { guestId, isChild } = update
        
        // Extra safety check - make sure isChild is explicitly a boolean
        const isChildValue = isChild === true
        
        // Update the guest
        const updatedGuest = await prisma.guest.update({
          where: { id: guestId },
          data: { isChild: isChildValue },
          select: { id: true, name: true, isChild: true }
        })
        
        // Log success
        console.log(`Updated guest ${updatedGuest.name}: isChild=${updatedGuest.isChild}`)
        
        // Add to results
        results.push({
          guestId,
          name: updatedGuest.name,
          success: true,
          isChild: updatedGuest.isChild
        })
      } catch (err) {
        // Log error
        console.error(`Error updating guest ${update.guestId}:`, err)
        
        // Add to results
        results.push({
          guestId: update.guestId,
          success: false,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      householdName: household.name,
      results
    })
  } catch (error) {
    console.error("DEBUG Error:", error)
    return NextResponse.json(
      { error: "Failed to update children status" },
      { status: 500 }
    )
  }
} 