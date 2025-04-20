"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function FixNiyahPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixNiyah = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/fix-niyah')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix Niyah')
      }
      
      setResult(data)
      toast({
        title: "Success",
        description: "Niyah's child status has been fixed!",
      })
    } catch (err) {
      console.error("Error fixing Niyah:", err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fix Niyah's child status.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Niyah's Child Status</h1>
      
      <Card className="max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Issue Description</CardTitle>
          <CardDescription>
            Niyah Dublin is a child, but the system is not recognizing her as one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            There appears to be an issue with how the <code>isChild</code> flag is being transmitted 
            from the database to the frontend. This tool will:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mb-4">
            <li>Find Niyah in the database</li>
            <li>Explicitly set her <code>isChild</code> flag to <code>true</code></li>
            <li>Verify that the change was made correctly</li>
          </ol>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={fixNiyah} 
            disabled={loading || result !== null}
          >
            {loading ? "Fixing..." : "Fix Niyah's Status"}
          </Button>
          
          {result && (
            <Link href={`/rsvp/${result.household.code}`}>
              <Button variant="outline">
                Go to RSVP <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
      
      {result && (
        <Card className="max-w-2xl mb-8 border-green-500">
          <CardHeader className="bg-green-50">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <CardTitle>Success!</CardTitle>
            </div>
            <CardDescription>
              Niyah's status was successfully updated in the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Before:</h3>
                <p>isChild: {String(result.before.isChild)}</p>
                <p>Type: {result.before.type}</p>
              </div>
              <div>
                <h3 className="font-semibold">After:</h3>
                <p>isChild: {String(result.after.isChild)}</p>
                <p>Type: {result.after.type}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold">Household:</h3>
              <p>Name: {result.household.name}</p>
              <p>Code: {result.household.code}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="max-w-2xl border-red-500">
          <CardHeader className="bg-red-50">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 