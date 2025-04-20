import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // First, locate Niyah using a direct name search
    const niyah = await prisma.guest.findFirst({
      where: {
        name: {
          contains: "Niyah",
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        name: true,
        isChild: true,
        household: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    if (!niyah) {
      return NextResponse.json(
        { error: "Niyah not found in database" },
        { status: 404 }
      )
    }

    // Log the current state
    console.log(`Found Niyah: ${niyah.name}`)
    console.log(`Current isChild value: ${niyah.isChild}, type: ${typeof niyah.isChild}`)

    // Update using Prisma with explicit true value
    const updated = await prisma.guest.update({
      where: { id: niyah.id },
      data: {
        // Force true as a boolean, not a string or other type
        isChild: true
      },
      select: {
        id: true,
        name: true,
        isChild: true
      }
    })

    console.log(`After update: isChild=${updated.isChild}, type=${typeof updated.isChild}`)

    // Also check raw access to the database to confirm
    const rawQuery = await prisma.$queryRaw`SELECT id, name, "isChild" FROM "Guest" WHERE id = ${niyah.id}`
    console.log("Raw database value:", rawQuery)

    return NextResponse.json({
      message: "Niyah child status fixed",
      before: {
        isChild: niyah.isChild,
        type: typeof niyah.isChild
      },
      after: {
        isChild: updated.isChild,
        type: typeof updated.isChild
      },
      rawResult: rawQuery,
      household: niyah.household
    })
  } catch (error) {
    console.error("Error fixing Niyah:", error)
    return NextResponse.json(
      { error: "Failed to fix Niyah's status" },
      { status: 500 }
    )
  }
} 