"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { QuestionType, QUESTION_TYPES } from "./types"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Save, 
  X, 
  Type, 
  ListOrdered, 
  Calendar, 
  ToggleLeft,
  CheckSquare,
  Plus,
  Trash,
  Loader2,
  AlertCircle,
  GripVertical
} from "lucide-react"
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

interface QuestionFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: {
    id?: string
    question: string
    type: QuestionType
    options: string
    isRequired: boolean
    perGuest: boolean
    isActive: boolean
    order: number
  }
}

interface DraggableOptionProps {
  option: string
  index: number
  moveOption: (dragIndex: number, hoverIndex: number) => void
  onDelete: () => void
}

const DraggableOption = ({ option, index, moveOption, onDelete }: DraggableOptionProps) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'OPTION',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, dropRef] = useDrop({
    accept: 'OPTION',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveOption(item.index, index)
        item.index = index
      }
    },
  })

  // Combine the refs
  const ref = (node: HTMLDivElement | null) => {
    dragRef(node)
    dropRef(node)
  }

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
      <span className="flex-1">{option}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-8 w-8 text-red-500 hover:text-red-600"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function QuestionForm({ onSubmit, onCancel, initialData }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    question: "",
    type: "TEXT" as QuestionType,
    options: [] as string[],
    isRequired: false,
    perGuest: false,
    isActive: true,
    order: 0,
    ...initialData,
    options: initialData ? 
      (typeof initialData.options === 'string' ? 
        JSON.parse(initialData.options) : 
        initialData.options) : 
      []
  })
  const [newOption, setNewOption] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.question.trim()) {
      newErrors.question = "Question text is required"
    }

    if ((formData.type === "MULTIPLE_CHOICE" || formData.type === "MULTIPLE_SELECT") && formData.options.length === 0) {
      newErrors.options = "At least one option is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        options: JSON.stringify(formData.options)
      })
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()]
      })
      setNewOption("")
      setErrors({ ...errors, options: "" })
    }
  }

  const removeOption = (indexToRemove: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, index) => index !== indexToRemove)
    })
  }

  const moveOption = (dragIndex: number, hoverIndex: number) => {
    const newOptions = [...formData.options]
    const draggedOption = newOptions[dragIndex]
    newOptions.splice(dragIndex, 1)
    newOptions.splice(hoverIndex, 0, draggedOption)
    setFormData({
      ...formData,
      options: newOptions
    })
  }

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "TEXT": return <Type className="h-4 w-4" />
      case "MULTIPLE_CHOICE": return <ListOrdered className="h-4 w-4" />
      case "MULTIPLE_SELECT": return <CheckSquare className="h-4 w-4" />
      case "BOOLEAN": return <ToggleLeft className="h-4 w-4" />
      case "DATE": return <Calendar className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getTypeDescription = (type: QuestionType) => {
    switch (type) {
      case "TEXT": return "Free text response"
      case "MULTIPLE_CHOICE": return "Single selection from a list of options"
      case "MULTIPLE_SELECT": return "Multiple selections from a list of options"
      case "BOOLEAN": return "Yes/No response"
      case "DATE": return "Date selection"
      default: return ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className={`text-sm font-medium ${errors.question ? 'text-red-500' : ''}`}>
            Question Text <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.question}
            onChange={(e) => {
              setFormData({ ...formData, question: e.target.value })
              setErrors({ ...errors, question: "" })
            }}
            className={`h-9 ${errors.question ? 'border-red-500' : ''}`}
            placeholder="Enter your question here..."
          />
          {errors.question && (
            <p className="text-sm text-red-500">{errors.question}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Question Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ 
              ...formData, 
              type: value as QuestionType,
              options: [] // Reset options when type changes
            })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <div>
                      <span>{type}</span>
                      <p className="text-xs text-gray-500">{getTypeDescription(type)}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(formData.type === "MULTIPLE_CHOICE" || formData.type === "MULTIPLE_SELECT") && (
          <div className="space-y-4">
            <Label className={`text-sm font-medium ${errors.options ? 'text-red-500' : ''}`}>
              Options <span className="text-red-500">*</span>
            </Label>
            
            <DndProvider backend={HTML5Backend}>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <DraggableOption
                    key={index}
                    option={option}
                    index={index}
                    moveOption={moveOption}
                    onDelete={() => removeOption(index)}
                  />
                ))}
              </div>
            </DndProvider>

            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Enter a new option..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addOption()
                  }
                }}
              />
              <Button
                type="button"
                onClick={addOption}
                disabled={!newOption.trim()}
                className="bg-gold hover:bg-[#c19b2f] text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {errors.options && (
              <p className="text-sm text-red-500">{errors.options}</p>
            )}

            <p className="text-sm text-gray-500">
              Drag and drop to reorder options. Press Enter to quickly add multiple options.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={formData.isRequired}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isRequired: checked as boolean })
              }
              className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <Label htmlFor="required" className="text-sm font-medium">
              Required question
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="perGuest"
              checked={formData.perGuest}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, perGuest: checked as boolean })
              }
              className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <Label htmlFor="perGuest" className="text-sm font-medium">
              Ask for each guest
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isActive: checked as boolean })
              }
              className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <Label htmlFor="isActive" className="text-sm font-medium">
              Active
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Display Order <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="h-9"
            min="0"
          />
          <p className="text-xs text-gray-500">
            Questions are displayed in ascending order
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 sm:flex-none"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none bg-gold hover:bg-[#c19b2f] text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Update Question' : 'Save Question'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}