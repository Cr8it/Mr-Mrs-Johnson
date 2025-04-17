import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Fetch meal options with guest counts
    const mealOptions = await prisma.mealOption.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { guests: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Fetch dessert options with guest counts
    const dessertOptions = await prisma.dessertOption.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { guests: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Transform the data to include guest counts
    const transformedMealOptions = mealOptions.map(option => ({
      id: option.id,
      name: option.name,
      isActive: option.isActive,
      isChildOption: option.isChildOption,
      order: option.order,
      guestCount: option._count.guests
    }))

    const transformedDessertOptions = dessertOptions.map(option => ({
      id: option.id,
      name: option.name,
      isActive: option.isActive,
      isChildOption: option.isChildOption,
      order: option.order,
      guestCount: option._count.guests
    }))

    return NextResponse.json({
      mealOptions: transformedMealOptions,
      dessertOptions: transformedDessertOptions
    })
  } catch (error) {
    console.error("Error fetching menu options:", error)
    return NextResponse.json(
      { error: "Failed to fetch menu options" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { type, name, isChildOption } = data

    if (!type || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: "Type and name are required" },
        { status: 400 }
      )
    }

    // Get the current highest order
    const model = type === 'meal' ? prisma.mealOption : prisma.dessertOption
    const lastOption = await model.findFirst({
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastOption?.order ?? -1) + 1

    // Create the new option
    const option = await model.create({
      data: {
        name: name.trim(),
        isChildOption: Boolean(isChildOption),
        order: nextOrder
      }
    })

    return NextResponse.json(option)
  } catch (error) {
    console.error("Error creating menu option:", error)
    return NextResponse.json(
      { error: "Failed to create menu option" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { type, items } = await request.json()

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    const model = type === 'meal' ? prisma.mealOption : prisma.dessertOption
    
    // Update all items in a transaction
    await prisma.$transaction(
      items.map(item => 
        model.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating menu options order:", error)
    return NextResponse.json(
      { error: "Failed to update menu options order" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID and type are required" },
        { status: 400 }
      )
    }

    const model = type === 'meal' ? prisma.mealOption : prisma.dessertOption
    await model.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting menu option:", error)
    return NextResponse.json(
      { error: "Failed to delete menu option" },
      { status: 500 }
    )
  }
} 