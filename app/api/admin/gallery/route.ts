import { NextResponse } from 'next/server'
import { writeFile, readdir, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    const uploadedImages = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const uniqueId = uuidv4()
      const extension = file.name.split('.').pop()
      const filename = `${uniqueId}.${extension}`

      // Save to public directory
      const path = join(process.cwd(), 'public', 'gallery', filename)
      await writeFile(path, buffer)

      // Add to uploaded images array
      uploadedImages.push({
        id: uniqueId,
        url: `/gallery/${filename}`,
        alt: file.name,
        order: 9999 // New images go to the end
      })
    }

    // Update order.json with new images
    const galleryPath = join(process.cwd(), 'public', 'gallery')
    const orderFilePath = join(galleryPath, 'order.json')
    
    try {
      const orderData = await readFile(orderFilePath, 'utf-8')
      const currentOrder = JSON.parse(orderData)
      
      // Filter out any placeholder images (those with external URLs)
      const localImages = currentOrder.filter((img: any) => img.url.startsWith('/gallery/'))
      
      // Add new images
      const newOrder = [...localImages, ...uploadedImages]
      
      // Update order numbers
      newOrder.forEach((img: any, index: number) => {
        img.order = index
      })
      
      await writeFile(orderFilePath, JSON.stringify(newOrder, null, 2))
    } catch {
      // If order.json doesn't exist, create it with just the new images
      await writeFile(orderFilePath, JSON.stringify(uploadedImages, null, 2))
    }

    return NextResponse.json({ 
      success: true, 
      images: uploadedImages 
    })
  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const galleryPath = join(process.cwd(), 'public', 'gallery')
    const orderFilePath = join(galleryPath, 'order.json')
    
    let orderedImages: any[] = []
    
    try {
      // Try to read the order file
      const orderData = await readFile(orderFilePath, 'utf-8')
      orderedImages = JSON.parse(orderData)
      
      // Check if we have any local images
      const hasLocalImages = orderedImages.some((img: any) => img.url.startsWith('/gallery/'))
      
      if (!hasLocalImages) {
        // If we only have placeholder images, scan directory for actual uploads
        const files = await readdir(galleryPath)
        const localImages = files
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
          .map((file, index) => ({
            id: file.split('.')[0],
            url: `/gallery/${file}`,
            alt: file,
            order: index
          }))
        
        if (localImages.length > 0) {
          // If we found local images, use those instead of placeholders
          orderedImages = localImages
          await writeFile(orderFilePath, JSON.stringify(localImages, null, 2))
        }
      }
    } catch {
      // If order file doesn't exist, create it from existing files
      const files = await readdir(galleryPath)
      orderedImages = files
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
        .map((file, index) => ({
          id: file.split('.')[0],
          url: `/gallery/${file}`,
          alt: file,
          order: index
        }))
      
      // Save the initial order
      await writeFile(orderFilePath, JSON.stringify(orderedImages, null, 2))
    }

    // Sort images by order
    orderedImages.sort((a, b) => a.order - b.order)

    return NextResponse.json({ 
      success: true, 
      images: orderedImages 
    })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const galleryPath = join(process.cwd(), 'public', 'gallery')
    const orderFilePath = join(galleryPath, 'order.json')
    
    // Remove from order.json first
    try {
      const orderData = await readFile(orderFilePath, 'utf-8')
      const currentOrder = JSON.parse(orderData)
      const newOrder = currentOrder.filter((img: any) => img.id !== id)
      await writeFile(orderFilePath, JSON.stringify(newOrder, null, 2))
    } catch (error) {
      console.error('Error updating order.json:', error)
    }
    
    // Then try to delete the file
    const files = await readdir(galleryPath)
    const fileToDelete = files.find(file => file.startsWith(id))
    if (fileToDelete) {
      await unlink(join(galleryPath, fileToDelete))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    )
  }
} 