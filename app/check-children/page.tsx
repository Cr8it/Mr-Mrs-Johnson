"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle } from "lucide-react"

interface ChildGuest {
  id: string
  name: string
  isChild: boolean
  householdName: string
  householdCode: string
}

export default function CheckChildrenPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<ChildGuest[]>([])
  
  useEffect(() => {
    fetchChildren()
  }, [])
  
  const fetchChildren = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/check-children')
      
      if (!response.ok) {
        throw new Error('Failed to fetch children')
      }
      
      const data = await response.json()
      setChildren(data.children)
    } catch (error) {
      console.error('Error fetching children:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch children from database",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const fixChildStatus = async (id: string, name: string, shouldBeChild: boolean) => {
    try {
      const response = await fetch('/api/fix-child-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: id,
          isChild: shouldBeChild,
          guestName: name,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update child status')
      }
      
      await fetchChildren()
      
      toast({
        title: "Success",
        description: `${name}'s child status has been updated.`,
      })
    } catch (error) {
      console.error('Error updating child status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update child status",
      })
    }
  }
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Child Guest Status</h1>
        <Button 
          onClick={fetchChildren}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p>No children found in the database.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => (
            <Card key={child.id} className={child.isChild ? "border-green-500" : "border-red-500"}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {child.isChild ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <CardTitle>{child.name}</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant={child.isChild ? "destructive" : "default"}
                    onClick={() => fixChildStatus(child.id, child.name, !child.isChild)}
                  >
                    {child.isChild ? "Mark as Adult" : "Mark as Child"}
                  </Button>
                </div>
                <CardDescription>
                  Household: {child.householdName} (Code: {child.householdCode})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p><strong>Current Status:</strong> {child.isChild ? "Child" : "Adult"}</p>
                  <p><strong>Guest ID:</strong> {child.id}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 