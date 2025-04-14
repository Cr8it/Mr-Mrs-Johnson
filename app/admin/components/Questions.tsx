"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, GripVertical, Save } from "lucide-react"
import { QuestionType, QUESTION_TYPES } from "./types"

import { useToast } from "@/components/ui/use-toast"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"

interface Question {
  id: string
  type: QuestionType
  question: string
  options: string[]
  isRequired: boolean
  perGuest: boolean
  order: number
  isActive: boolean
}

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/admin/questions')
      if (!response.ok) throw new Error('Failed to fetch questions')
      
      const data = await response.json()
      const questionsWithArrayOptions = data.map((q: any) => ({
        ...q,
        options: q.options 
          ? (typeof q.options === 'string' 
              ? (
                  // Try to parse as JSON
                  q.options.startsWith('[') 
                    ? JSON.parse(q.options) 
                    : q.options.split(',').filter(Boolean)
                )
              : q.options
            )
          : []
      }))
      
      setQuestions(questionsWithArrayOptions.sort((a: Question, b: Question) => a.order - b.order))
    } catch (error) {
      console.error('Failed to load questions:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions"
      })
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `random_${Math.random().toString(36).substr(2, 9)}`,
      type: "TEXT" as QuestionType,
      question: "",
      options: [],
      isRequired: false,
      perGuest: false,
      order: questions.length,
      isActive: true
    }
    setQuestions([...questions, newQuestion])
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      if (!questionId.includes('random')) {
        const response = await fetch(`/api/admin/questions/${questionId}`, {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete question')
      }
      setQuestions(questions.filter(q => q.id !== questionId))
      toast({
        title: "Success",
        description: "Question deleted successfully"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question"
      })
    }
  }

  const saveQuestions = async () => {
    try {
      const questionsToSave = questions.map(q => ({
        ...q,
        // Process options for both MULTIPLE_CHOICE and MULTIPLE_SELECT
        options: (q.type === "MULTIPLE_CHOICE" || q.type === "MULTIPLE_SELECT") 
          ? q.options.filter(Boolean) 
          : []
      }))
      
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionsToSave)
      })
      
      if (!response.ok) throw new Error('Failed to save questions')
      await fetchQuestions() // Refresh the list after saving
      
      toast({
        title: "Success",
        description: "Questions saved successfully"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save questions"
      })
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return
    
    const items = Array.from(questions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }))
    
    setQuestions(updatedItems)
  }

  if (loading) return <div>Loading questions...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Custom Questions</h2>
          <p className="text-sm text-muted-foreground">Manage your RSVP form questions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addQuestion} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
          <Button onClick={saveQuestions} variant="default">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No questions added yet.</p>
            <Button onClick={addQuestion} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Question
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex items-center gap-2 mb-6 p-3 bg-background rounded text-sm text-muted-foreground">
              <GripVertical className="h-4 w-4" />
              <span>Drag questions to reorder them</span>
            </div>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-all ${snapshot.isDragging ? 'opacity-50' : ''}`}
                        >
                          <Card className="border-2 hover:border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50">
                              <div className="flex items-center gap-4">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="p-2 rounded hover:bg-background cursor-move"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                                  <CardDescription>Type: {question.type.toLowerCase()}</CardDescription>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteQuestion(question.id)}
                                className="hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Question Text</label>
                                  <Input
                                    placeholder="Enter your question..."
                                    value={question.question}
                                    onChange={(e) =>
                                      setQuestions(
                                        questions.map((q) => (q.id === question.id ? { ...q, question: e.target.value } : q))
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Question Type</label>
                                    <Select
                                    value={question.type}
                                    onValueChange={(value: QuestionType) =>
                                      setQuestions(
                                      questions.map((q) => (q.id === question.id ? { ...q, type: value, options: [] } : q))
                                      )
                                    }
                                    >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select question type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {QUESTION_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                                      </SelectItem>
                                      ))}
                                    </SelectContent>
                                    </Select>

                                </div>
                                {(question.type === "MULTIPLE_CHOICE" || question.type === "MULTIPLE_SELECT") && (
                                  <div className="space-y-2 border-l-2 pl-4">
                                    <label className="text-sm font-medium">Answer Options</label>
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex space-x-2">
                                        <Input
                                          placeholder="Option text..."
                                          value={option}
                                          onChange={(e) =>
                                            setQuestions(
                                              questions.map((q) =>
                                                q.id === question.id
                                                  ? {
                                                      ...q,
                                                      options: q.options.map((opt, i) =>
                                                        i === optionIndex ? e.target.value : opt
                                                      ),
                                                    }
                                                  : q
                                              )
                                            )
                                          }
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            setQuestions(
                                              questions.map((q) =>
                                                q.id === question.id
                                                  ? {
                                                      ...q,
                                                      options: q.options.filter((_, i) => i !== optionIndex),
                                                    }
                                                  : q
                                              )
                                            )
                                          }
                                          className="hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setQuestions(
                                          questions.map((q) =>
                                            q.id === question.id ? { ...q, options: [...q.options, ""] } : q
                                          )
                                        )
                                      }
                                      className="mt-2"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Option
                                    </Button>
                                  </div>
                                )}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`required-${question.id}`}
                                      checked={question.isRequired}
                                      onCheckedChange={(checked) =>
                                        setQuestions(
                                          questions.map((q) =>
                                            q.id === question.id ? { ...q, isRequired: !!checked } : q
                                          )
                                        )
                                      }
                                    />
                                    <label htmlFor={`required-${question.id}`} className="text-sm">Required</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`perGuest-${question.id}`}
                                      checked={question.perGuest}
                                      onCheckedChange={(checked) =>
                                        setQuestions(
                                          questions.map((q) =>
                                            q.id === question.id ? { ...q, perGuest: !!checked } : q
                                          )
                                        )
                                      }
                                    />
                                    <label htmlFor={`perGuest-${question.id}`} className="text-sm">Per Guest</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`active-${question.id}`}
                                      checked={question.isActive}
                                      onCheckedChange={(checked) =>
                                        setQuestions(
                                          questions.map((q) =>
                                            q.id === question.id ? { ...q, isActive: !!checked } : q
                                          )
                                        )
                                      }
                                    />
                                    <label htmlFor={`active-${question.id}`} className="text-sm">Active</label>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  )
}

