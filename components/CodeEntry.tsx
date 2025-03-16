"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface CodeEntryProps {
  onSuccess: (household: any) => void
}

export default function CodeEntry({ onSuccess }: CodeEntryProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/test-household?code=${code.trim()}`)
      const data = await response.json()

      if (response.ok && data) {
        onSuccess(data)
        toast({
          title: "Welcome!",
          description: `Found ${data.name}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No invitation found with that code.",
        })
      }
    } catch (error) {
      console.error("Error finding household:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to find household",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Enter your RSVP code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="text-center uppercase"
        required
      />
      <Button type="submit" className="mt-2 bg-blue-500 text-white" disabled={loading}>
        {loading ? "Searching..." : "Find My Invitation"}
      </Button>
    </form>
  )
} 