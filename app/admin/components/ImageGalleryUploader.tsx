"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { toast } from 'sonner'

interface ImageGalleryUploaderProps {
  onImagesUploaded: (images: { id: string; url: string; alt: string }[]) => void
}

export function ImageGalleryUploader({ onImagesUploaded }: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to upload images')

      toast.success('Images uploaded successfully')
      onImagesUploaded(data.images)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
      // Reset the file input
      event.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted">
      <input
        type="file"
        id="gallery-upload"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <Button
        variant="outline"
        size="lg"
        className="w-full max-w-xs"
        disabled={uploading}
        onClick={() => document.getElementById('gallery-upload')?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? 'Uploading...' : 'Upload Images'}
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload multiple images at once. Supported formats: JPG, PNG, GIF
      </p>
    </div>
  )
} 