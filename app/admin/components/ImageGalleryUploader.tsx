"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, AlertCircle } from "lucide-react"
import { toast } from 'sonner'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageGalleryUploaderProps {
  onImagesUploaded: (images: { id: string; url: string; alt: string }[]) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function ImageGalleryUploader({ onImagesUploaded }: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (files: FileList): string | null => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return `File "${file.name}" has unsupported type. Allowed types: JPG, PNG, GIF, WebP`
      }
      if (file.size > MAX_FILE_SIZE) {
        return `File "${file.name}" exceeds 10MB size limit`
      }
    }
    return null
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setError(null)
    const validationError = validateFiles(files)
    if (validationError) {
      setError(validationError)
      event.target.value = ''
      return
    }

    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload images')
      }

      toast.success('Images uploaded successfully')
      onImagesUploaded(data.images)
    } catch (error) {
      console.error('Error uploading images:', error)
      const message = error instanceof Error 
        ? error.message
        : error instanceof DOMException && error.name === 'AbortError'
          ? 'Upload timed out. Please try again.'
          : 'Failed to upload images'
      toast.error(message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted">
        <input
          type="file"
          id="gallery-upload"
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
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
          Upload multiple images at once. Max size: 10MB per file.
          <br />
          Supported formats: JPG, PNG, GIF, WebP
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 