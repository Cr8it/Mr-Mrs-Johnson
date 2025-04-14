"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Loader2, 
  Settings2, 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  Type, 
  ListOrdered, 
  Calendar, 
  ToggleLeft,
  CheckSquare,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { QuestionType } from "./types"
import { Card } from "@/components/ui/card"
import { QuestionForm } from "./QuestionForm"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Question {
  id: string
  question: string
  type: QuestionType
  options: string
  isRequired: boolean
  isActive: boolean
  order: number
  perGuest: boolean
}

export default function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/admin/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const data = await response.json()
      setQuestions(data.sort((a: Question, b: Question) => a.order - b.order))
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch questions",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = async (questionData: Partial<Question>) => {
    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...questionData,
          order: questions.length,
        }),
      })

      if (!response.ok) throw new Error("Failed to create question")
      
      await fetchQuestions()
      setShowForm(false)
      toast({
        title: "Success",
        description: "Question added successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add question",
      })
    }
  }

  const handleEditQuestion = async (questionData: Partial<Question>) => {
    if (!editingQuestion) return

    try {
      const response = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      })

      if (!response.ok) throw new Error("Failed to update question")
      
      await fetchQuestions()
      setEditingQuestion(null)
      toast({
        title: "Success",
        description: "Question updated successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question",
      })
    }
  }

  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return

    try {
      const response = await fetch(`/api/admin/questions/${deleteQuestion.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete question")
      
      await fetchQuestions()
      setDeleteQuestion(null)
      toast({
        title: "Success",
        description: "Question deleted successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question",
      })
    }
  }

  const handleToggleActive = async (question: Question) => {
    try {
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...question,
          isActive: !question.isActive,
        }),
      })

      if (!response.ok) throw new Error("Failed to update question")
      
      await fetchQuestions()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question status",
      })
    }
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

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "TEXT": return "Text Response"
      case "MULTIPLE_CHOICE": return "Single Choice"
      case "MULTIPLE_SELECT": return "Multiple Choice"
      case "BOOLEAN": return "Yes/No"
      case "DATE": return "Date"
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-gray-500 dark:text-gray-400">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom Questions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your RSVP form questions. Questions will be shown in the order specified.
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gold hover:bg-[#c19b2f] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Questions Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first question to the RSVP form.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="mt-4 bg-gold hover:bg-[#c19b2f] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Question
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-md transition-all bg-white dark:bg-gray-800 p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/10 text-gold">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {question.question}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(question.type)}
                        {getTypeLabel(question.type)}
                      </Badge>
                      {question.isRequired && (
                        <Badge variant="secondary">Required</Badge>
                      )}
                      {question.perGuest && (
                        <Badge variant="secondary">Per Guest</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={question.isActive}
                      onCheckedChange={() => handleToggleActive(question)}
                      className="data-[state=checked]:bg-gold"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingQuestion(question)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteQuestion(question)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {(question.type === "MULTIPLE_CHOICE" || question.type === "MULTIPLE_SELECT") && (
                  <div className="mt-4 pl-11">
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        try {
                          return JSON.parse(question.options).map((option: string, index: number) => (
                            <Badge 
                              key={index}
                              variant="secondary"
                              className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {option}
                            </Badge>
                          ))
                        } catch {
                          return null
                        }
                      })()}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question for your RSVP form.
            </DialogDescription>
          </DialogHeader>
          <QuestionForm
            onSubmit={handleAddQuestion}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Modify the existing question.
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <QuestionForm
              initialData={editingQuestion}
              onSubmit={handleEditQuestion}
              onCancel={() => setEditingQuestion(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question
              and all associated responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 