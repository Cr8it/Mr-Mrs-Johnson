"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageGalleryUploader } from '../components/ImageGalleryUploader'
import { ImagePreview } from '../components/ImagePreview'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableImage } from '../components/SortableImage'
import { toast } from 'sonner'

export default function PhotoGalleryPage() {
  const [images, setImages] = useState<{ id: string; url: string; alt: string }[]>([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const displayedImages = showAll ? images : images.slice(0, 6)
  const hasMoreImages = images.length > 6

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/admin/gallery')
        const data = await response.json()
        if (data.success) {
          setImages(data.images)
        }
      } catch (error) {
        console.error('Error fetching images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  const handleImagesUploaded = (newImages: { id: string; url: string; alt: string }[]) => {
    setImages(prev => [...prev, ...newImages])
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/admin/gallery/${imageId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setImages(prev => prev.filter(img => img.id !== imageId))
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Save the new order to the server
        fetch('/api/admin/gallery/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ images: newOrder.map((img, index) => ({ id: img.id, order: index })) }),
        })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            toast.error('Failed to save image order')
          }
        })
        .catch(() => {
          toast.error('Failed to save image order')
        })

        return newOrder
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery Management</CardTitle>
          <CardDescription>
            Upload and manage photos for your wedding gallery. Drag and drop to reorder images. The gallery will display up to 6 images by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageGalleryUploader onImagesUploaded={handleImagesUploaded} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Gallery Images</CardTitle>
          <CardDescription>
            {images.length} image{images.length !== 1 ? 's' : ''} in total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No images uploaded yet</div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={displayedImages} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedImages.map((image) => (
                      <SortableImage
                        key={image.id}
                        image={image}
                        onDelete={() => handleDeleteImage(image.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {hasMoreImages && !showAll && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAll(true)}
                  >
                    See More ({images.length - 6} more)
                  </Button>
                </div>
              )}
              {showAll && hasMoreImages && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAll(false)}
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 