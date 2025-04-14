"use client"

import { useState } from "react"
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
  HelpCircle, 
  Save, 
  X, 
  Type, 
  ListOrdered, 
  Calendar, 
  ToggleLeft,
  Loader2,
  CheckSquare
} from "lucide-react"

interface QuestionFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function QuestionForm({ onSubmit, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    question: "",
    type: "TEXT" as QuestionType,
    options: "",
    isRequired: false,
    perGuest: false,
    isActive: true,
    order: 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        options: formData.type === "MULTIPLE_CHOICE"
          ? formData.options.split(",").map(opt => opt.trim())
          : []
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "TEXT": return <Type className="h-4 w-4" />
      case "MULTIPLE_CHOICE": return <ListOrdered className="h-4 w-4" />
      case "MULTIPLE_SELECT": return <CheckSquare className="h-4 w-4" />
      case "BOOLEAN": return <ToggleLeft className="h-4 w-4" />
      case "DATE": return <Calendar className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Question Text
          </Label>
          <Input
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="h-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            placeholder="Enter your question here..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Question Type
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as QuestionType })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800">
              {QUESTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <span>{type}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(formData.type === "MULTIPLE_CHOICE" || formData.type === "MULTIPLE_SELECT") && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Options
            </Label>
            <Textarea
              value={formData.options}
              onChange={(e) => setFormData({ ...formData, options: e.target.value })}
              placeholder="Enter options separated by commas..."
              className="min-h-[80px] resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter options separated by commas (e.g., "Option 1, Option 2, Option 3")
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
            Display Order
          </Label>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="h-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            min="0"
            required
          />
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
              Save Question
            </>
          )}
        </Button>
      </div>
    </form>
  )
}