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
  CheckSquare,
  Plus,
  Trash
} from "lucide-react"

interface QuestionFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function QuestionForm({ onSubmit, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    question: "",
    type: "TEXT" as QuestionType,
    options: [] as string[],
    isRequired: false,
    perGuest: false,
    isActive: true,
    order: 0
  })
  const [newOption, setNewOption] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        options: (formData.type === "MULTIPLE_CHOICE" || formData.type === "MULTIPLE_SELECT")
          ? formData.options
          : []
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
    }
  }

  const removeOption = (indexToRemove: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, index) => index !== indexToRemove)
    })
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

  const getQuestionTypeDescription = (type: QuestionType) => {
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
          <Label className="text-sm font-medium">
            Question Text <span className="text-red-500">*</span>
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
            <SelectContent className="dark:bg-gray-800">
              {QUESTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <div>
                      <span>{type}</span>
                      <p className="text-xs text-gray-500">{getQuestionTypeDescription(type)}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(formData.type === "MULTIPLE_CHOICE" || formData.type === "MULTIPLE_SELECT") && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Options <span className="text-red-500">*</span>
            </Label>
            
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {option}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Enter a new option..."
                className="flex-1"
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
            
            {formData.options.length === 0 && (
              <p className="text-sm text-red-500">
                At least one option is required
              </p>
            )}
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
          disabled={loading || (
            (formData.type === "MULTIPLE_CHOICE" || formData.type === "MULTIPLE_SELECT") && 
            formData.options.length === 0
          )}
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