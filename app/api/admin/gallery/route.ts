import { NextResponse } from 'next/server'
import { supabase, getPublicUrl } from '@/app/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300 // 5 minutes timeout

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface GalleryImage {
  id: string
  url: string
  alt: string
  order: number
}

interface OrderedImage extends GalleryImage {
  order: number
}

export async function POST(request: Request) {
  try {
    console.log('Starting image upload process...')
    
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    console.log(`Processing ${files.length} files...`)
    
    const uploadedImages: GalleryImage[] = []

    // Validate files
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        console.log(`Invalid file type: ${file.type}`)
        return NextResponse.json(
          { 
            success: false, 
            error: `File type ${file.type} is not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` 
          },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        console.log(`File too large: ${file.size} bytes`)
        return NextResponse.json(
          { 
            success: false, 
            error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` 
          },
          { status: 400 }
        )
      }
    }

    // Ensure images folder exists
    const { data: folders } = await supabase.storage.from('gallery').list()
    if (!folders?.find(f => f.name === 'images')) {
      console.log('Creating images folder...')
      await supabase.storage
        .from('gallery')
        .upload('images/.keep', new Uint8Array(0), {
          contentType: 'text/plain'
        })
    }

    // Process each file
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Generate unique filename with original extension
        const uniqueId = uuidv4()
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const filename = `${uniqueId}.${extension}`
        const filepath = `images/${filename}`

        console.log(`Uploading to Supabase: ${filepath}`)
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filepath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Supabase storage error:', uploadError)
          throw uploadError
        }

        // Get the public URL
        console.log('Getting public URL...')
        const publicUrl = getPublicUrl(filepath)
        console.log('Public URL:', publicUrl)

        // Add to uploaded images array
        uploadedImages.push({
          id: uniqueId,
          url: publicUrl,
          alt: file.name,
          order: 9999 // New images go to the end
        })
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error)
        throw error
      }
    }

    // Update order.json with new images
    try {
      console.log('Updating order.json...')
      const { data: orderFile, error: fetchError } = await supabase.storage
        .from('gallery')
        .download('order.json')

      let currentOrder: GalleryImage[] = []
      if (!fetchError && orderFile) {
        const text = await orderFile.text()
        try {
          currentOrder = JSON.parse(text)
          // Verify all images in currentOrder still exist
          const { data: files } = await supabase.storage
            .from('gallery')
            .list('images')

          const existingFiles = new Set(files?.map(f => f.name) || [])
          currentOrder = currentOrder.filter((img: GalleryImage) => {
            const filename = img.url.split('/').pop()
            return existingFiles.has(filename || '')
          })
        } catch (parseError) {
          console.error('Error parsing order.json:', parseError)
          currentOrder = []
        }
      }

      // Add new images to the order
      const newOrder = [...currentOrder, ...uploadedImages]
      
      // Update order numbers
      newOrder.forEach((img: GalleryImage, index: number) => {
        img.order = index
      })

      // Save updated order.json
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload('order.json', JSON.stringify(newOrder, null, 2), {
          contentType: 'application/json',
          upsert: true
        })

      if (uploadError) {
        console.error('Error updating order.json:', uploadError)
      }
    } catch (error) {
      console.error('Error updating order.json:', error)
    }

    if (uploadedImages.length === 0) {
      throw new Error('No images were uploaded successfully')
    }

    console.log(`Successfully uploaded ${uploadedImages.length} images`)
    return NextResponse.json({ 
      success: true, 
      images: uploadedImages 
    })
  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload images',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('Fetching gallery images...')
    
    // List all files in the images folder
    const { data: files, error: listError } = await supabase.storage
      .from('gallery')
      .list('images')

    if (listError) {
      console.error('Error listing files:', listError)
      throw listError
    }

    // Get order.json if it exists
    const { data: orderFile, error: orderError } = await supabase.storage
      .from('gallery')
      .download('order.json')

    let currentOrder: GalleryImage[] = []
    if (!orderError && orderFile) {
      try {
        const text = await orderFile.text()
        currentOrder = JSON.parse(text)
      } catch (parseError) {
        console.error('Error parsing order.json:', parseError)
      }
    }

    // Filter out the .keep file and get valid image files
    const imageFiles = files?.filter(file => 
      file.name !== '.keep' && 
      !file.name.endsWith('order.json')
    ) || []

    // Create URLs for all images
    const images: GalleryImage[] = imageFiles.map(file => ({
      id: file.name.split('.')[0],
      url: getPublicUrl(`images/${file.name}`),
      alt: file.name,
      order: 9999 // Default order for new images
    }))

    // Merge with order data
    let orderedImages = images
    if (currentOrder.length > 0) {
      // Create a map of existing images by ID
      const imageMap = new Map(images.map(img => [img.id, img]))
      
      // First, include all images that have an order
      orderedImages = currentOrder
        .filter((item: GalleryImage) => imageMap.has(item.id))
        .map((item: GalleryImage) => ({
          ...imageMap.get(item.id)!,
          order: item.order
        }))
      
      // Then add any new images that aren't in the order
      const orderedIds = new Set(currentOrder.map((item: GalleryImage) => item.id))
      const newImages = images.filter(img => !orderedIds.has(img.id))
      orderedImages = [...orderedImages, ...newImages]
    }

    // Sort images by order
    orderedImages.sort((a, b) => (a.order || 0) - (b.order || 0))

    console.log(`Returning ${orderedImages.length} images`)
    return NextResponse.json({ 
      success: true, 
      images: orderedImages 
    })
  } catch (error) {
    console.error('Error in gallery GET:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch gallery images',
        images: [] // Always return an array even in error case
      },
      { status: 500 }
    )
  }
}

// DELETE handler has been moved to [id]/route.ts 