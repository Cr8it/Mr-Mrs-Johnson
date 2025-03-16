"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GripVertical, Trash2 } from "lucide-react"

interface SortableImageProps {
  image: {
    id: string
    url: string
    alt: string
  }
  onDelete: () => void
}

export function SortableImage({ image, onDelete }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-[4/3] ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          size="icon"
          className="text-white hover:text-white hover:bg-white/20 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white hover:bg-white/20"
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  )
} 