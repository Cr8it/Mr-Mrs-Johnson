"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, HelpCircle, Settings2, ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { QuestionType } from "./types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { QuestionForm } from "./QuestionForm"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

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
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/admin/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      
      const data = await response.json()
      
      // Process options for each question
      const processedQuestions = data.map((q: any) => ({
        ...q,
        // Ensure options is properly parsed if it's a JSON string
        options: typeof q.options === 'string' && q.options
          ? q.options.trim() !== '' 
            ? q.options 
            : '[]'
          : '[]'
      }))
      
      setQuestions(processedQuestions)
    } catch (error) {
      console.error("Error fetching questions:", error)
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
          // Don't JSON.stringify the options as they're already in the correct format
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom Questions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your RSVP form questions</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gold hover:bg-[#c19b2f] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
        </div>

        <AnimatePresence>
        {showForm && (
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          >
          <Card className="border-gold/20 bg-gold/5">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-gold" />
              New Question
            </CardTitle>
            <CardDescription>
              Add a new question to your RSVP form
            </CardDescription>
            </CardHeader>
            <CardContent>
            <QuestionForm
              onSubmit={handleAddQuestion}
              onCancel={() => setShowForm(false)}
            />
            </CardContent>
          </Card>
          </motion.div>
        )}
        </AnimatePresence>

        <div className="grid gap-4">
        {questions.map((question, index) => (
          <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          >
            <Card className="group hover:shadow-md transition-all bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
              {question.question}
              {question.isRequired && (
                <Badge variant="secondary" className="text-xs">Required</Badge>
              )}
              </CardTitle>
              <CardDescription>
              {question.perGuest ? "Asked per guest" : "Asked per household"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
              checked={question.isActive}
              className="data-[state=checked]:bg-gold"
              />
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            </CardHeader>
            <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                {question.type}
                </Badge>
              </dd>
              </div>
              {(question.type === "MULTIPLE_CHOICE" || question.type === "MULTIPLE_SELECT") && (
              <div className="space-y-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Options</dt>
                <dd className="text-sm">
                {(() => {
                  try {
                  return JSON.parse(question.options).map((option: string, index: number) => (
                    <Badge 
                    key={index}
                    variant="secondary"
                    className="mr-2 mb-2"
                    >
                    {option}
                    </Badge>
                  ))
                  } catch {
                  return question.options
                  }
                })()}
                </dd>
              </div>
              )}
              <div className="space-y-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Order</dt>
              <dd className="flex items-center gap-2">
                <span>{question.order}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                <ArrowUpDown className="h-4 w-4" />
                </Button>
              </dd>
              </div>
            </dl>
            </CardContent>
          </Card>
          </motion.div>
        ))}
        </div>
    </div>
  )
} 