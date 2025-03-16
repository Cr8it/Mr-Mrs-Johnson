"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ImageGalleryUploaderProps {
  onImagesUploaded: (images: { id: string; url: string; alt: string }[]) => void
}

export function ImageGalleryUploader({ onImagesUploaded }: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for only image files and update selected files
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'))
    setSelectedFiles(prev => [...prev, ...imageFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload images')
      }

      onImagesUploaded(data.images)
      setSelectedFiles([])
      setUploadProgress(100)
      toast.success('Images uploaded successfully')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop the images here...'
            : 'Drag & drop images here, or click to select files'}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Selected Files ({selectedFiles.length}):
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted p-2 rounded-md"
              >
                <span className="text-sm truncate max-w-[200px]">
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {selectedFiles.length > 0 && !uploading && (
        <Button
          className="w-full"
          onClick={handleUpload}
        >
          Upload {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''}
        </Button>
      )}
    </div>
  )
} 