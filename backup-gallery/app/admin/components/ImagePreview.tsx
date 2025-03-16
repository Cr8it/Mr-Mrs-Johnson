"use client"

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from "@/components/ui/card"

interface ImagePreviewProps {
  image: {
    id: string
    url: string
    alt: string
  }
  onDelete: () => void
}

export function ImagePreview({ image, onDelete }: ImagePreviewProps) {
  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3]">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-2 right-2">
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 