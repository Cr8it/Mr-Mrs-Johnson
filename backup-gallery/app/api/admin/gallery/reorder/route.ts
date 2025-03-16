import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

interface ImageOrder {
  id: string
  order: number
}

export async function POST(request: Request) {
  try {
    const { images } = await request.json() as { images: ImageOrder[] }
    
    // Create a map of id to order for quick lookup
    const orderMap = new Map(images.map(img => [img.id, img.order]))
    
    const galleryPath = join(process.cwd(), 'public', 'gallery')
    const orderFilePath = join(galleryPath, 'order.json')
    
    try {
      // Read existing order file
      const orderData = await readFile(orderFilePath, 'utf-8')
      const currentOrder = JSON.parse(orderData)
      
      // Update orders while preserving other metadata
      const newOrder = currentOrder.map((img: any) => ({
        ...img,
        order: orderMap.get(img.id) ?? img.order
      }))
      
      // Sort by new order
      newOrder.sort((a: any, b: any) => a.order - b.order)
      
      // Save updated order
      await writeFile(orderFilePath, JSON.stringify(newOrder, null, 2))
      
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error updating order:', error)
      
      // If order file doesn't exist, create it with just the order info
      const newOrder = images.map(img => ({
        id: img.id,
        order: img.order,
        url: `/gallery/${img.id}`, // Basic URL, may need to be updated
        alt: img.id // Basic alt text
      }))
      
      await writeFile(orderFilePath, JSON.stringify(newOrder, null, 2))
      
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error reordering images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reorder images' },
      { status: 500 }
    )
  }
} 