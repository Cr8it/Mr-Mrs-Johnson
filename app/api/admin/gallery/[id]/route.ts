import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('Deleting image with ID:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Get the file extension from order.json
    const { data: orderFile } = await supabase.storage
      .from('gallery')
      .download('order.json')

    if (!orderFile) {
      return NextResponse.json(
        { success: false, error: 'Could not find order.json' },
        { status: 404 }
      )
    }

    const text = await orderFile.text()
    const images = JSON.parse(text)
    const image = images.find((img: any) => img.id === id)
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found in order.json' },
        { status: 404 }
      )
    }

    const filename = image.url.split('/').pop()
    console.log('Deleting file:', filename)
    
    // Delete the image file
    const { error: deleteError } = await supabase.storage
      .from('gallery')
      .remove([`images/${filename}`])

    if (deleteError) {
      console.error('Error deleting file:', deleteError)
      throw deleteError
    }

    // Update order.json
    console.log('Updating order.json...')
    const newOrder = images.filter((img: any) => img.id !== id)
    
    const { error: updateError } = await supabase.storage
      .from('gallery')
      .upload('order.json', JSON.stringify(newOrder, null, 2), {
        contentType: 'application/json',
        upsert: true
      })

    if (updateError) {
      console.error('Error updating order.json:', updateError)
      throw updateError
    }

    console.log('Successfully deleted image')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete image',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 