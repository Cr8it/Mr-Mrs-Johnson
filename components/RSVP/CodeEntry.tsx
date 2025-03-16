"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface CodeEntryProps {
  onSuccess: (household: any) => void
}

export function CodeEntry({ onSuccess }: CodeEntryProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Submitting code:", code)
      const response = await fetch("/api/rsvp/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()
      console.log("Response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to look up code")
      }

      toast({
        title: "Success!",
        description: `Welcome, ${data.name}!`,
      })

      onSuccess(data)
    } catch (error) {
      console.error("RSVP error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to look up code",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Enter your household code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center uppercase"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Looking up..." : "Continue"}
      </Button>
    </form>
  )
} 