"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Loader2, 
  HelpCircle, 
  Settings2, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Type, 
  Calendar, 
  ToggleLeft,
  ListOrdered,
  List 
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { QuestionType } from "./types"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card"
import { QuestionForm } from "./QuestionForm"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
  options: string // This is a JSON string
  isRequired: boolean
  isActive: boolean
  order: number
  perGuest: boolean
}

export default function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/admin/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const data = await response.json()
      setQuestions(data)
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
      
      const newQuestion = await response.json()
      setQuestions([...questions, newQuestion])
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

  const handleDeleteQuestion = async (id: string) => {
    try {
      setQuestionToDelete(null)
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete question")
      
      setQuestions(questions.filter(q => q.id !== id))
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

  const confirmDelete = (id: string) => {
    setQuestionToDelete(id)
    setDeleteConfirmOpen(true)
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
    <>
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Custom Questions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create and manage questions for your RSVP form
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

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this question and all responses to it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => questionToDelete && handleDeleteQuestion(questionToDelete)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-gold/20 bg-white">
                <CardHeader className="bg-gold/10 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-gold" />
                    New Question
                  </CardTitle>
                  <CardDescription>
                    Add a new question to your RSVP form
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <QuestionForm
                    onSubmit={handleAddQuestion}
                    onCancel={() => setShowForm(false)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No questions yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first question.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="mt-4 bg-gold hover:bg-[#c19b2f] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                <div className="col-span-5">Question</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Settings</div>
                <div className="col-span-1">Order</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              
              {questions.map((question, index) => (
                <div key={question.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-5">
                      <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {question.question}
                      </div>
                      <div className="flex mt-1 items-center gap-2">
                        {question.isRequired && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                            Required
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {question.perGuest ? "Per Guest" : "Per Household"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(question.type)}
                        <span className="text-sm">{question.type}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.isActive}
                          className="data-[state=checked]:bg-gold"
                        />
                        <span className="text-sm">{question.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono w-6 text-center">{question.order}</span>
                        <div className="flex flex-col">
                          <Button variant="ghost" size="icon" className="h-4 w-4">
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-4 w-4">
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                        <Edit className="h-3.5 w-3.5" />
                        <span className="ml-1.5">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => confirmDelete(question.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="ml-1.5">Delete</span>
                      </Button>
                    </div>
                  </div>
                  
                  {(question.type === "MULTIPLE_CHOICE" || question.type === "MULTIPLE_SELECT") && (
                    <div className="px-4 pb-4 -mt-2">
                      <div className="text-xs font-medium text-gray-500 mb-1.5">Options:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          try {
                            return JSON.parse(question.options).map((option: string, index: number) => (
                              <Badge 
                                key={index}
                                variant="secondary"
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
} 