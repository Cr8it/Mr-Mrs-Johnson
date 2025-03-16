"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { ImagePreview } from "./ImagePreview"

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
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="group relative">
        <ImagePreview image={image} onDelete={onDelete} />
        <button
          className="absolute top-2 left-2 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
} 