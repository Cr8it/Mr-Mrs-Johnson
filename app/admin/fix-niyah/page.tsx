"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function FixNiyahPage() {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [niyahData, setNiyahData] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    findNiyah()
  }, [])

  const findNiyah = async () => {
    try {
      setSearchLoading(true)
      const response = await fetch('/api/admin/guests')
      const data = await response.json()
      
      let niyahFound = null
      
      // Search through all households and guests to find Niyah Dublin
      data.households.forEach((household: any) => {
        household.guests.forEach((guest: any) => {
          // Check for name containing "Niyah" and "Dublin" (case insensitive)
          if (guest.name.toLowerCase().includes('niyah') && guest.name.toLowerCase().includes('dublin')) {
            niyahFound = {
              id: guest.id,
              name: guest.name,
              isChild: guest.isChild,
              householdName: household.name,
              householdCode: household.code
            }
          }
        })
      })
      
      setNiyahData(niyahFound)
      
      if (!niyahFound) {
        toast({
          variant: "destructive",
          title: "Guest Not Found",
          description: "Could not find Niyah Dublin in the database"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search for Niyah Dublin"
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const fixNiyahChildStatus = async () => {
    if (!niyahData) return
    
    try {
      setLoading(true)
      setSuccess(false)
      
      const response = await fetch('/api/admin/fix-child-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: niyahData.id,
          guestName: niyahData.name,
          isChild: true
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix child status')
      }
      
      setSuccess(true)
      setNiyahData({
        ...niyahData,
        isChild: true
      })
      
      toast({
        title: "Success",
        description: data.message || "Successfully fixed Niyah's child status"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix child status"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Emergency Fix: Niyah Dublin Child Status</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fix Niyah Dublin's Child Status</CardTitle>
        </CardHeader>
        <CardContent>
          {searchLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <span className="ml-2">Searching for Niyah Dublin...</span>
            </div>
          ) : niyahData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{niyahData.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Guest ID</p>
                  <p className="font-mono text-xs">{niyahData.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Household</p>
                  <p>{niyahData.householdName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Household Code</p>
                  <p className="font-mono">{niyahData.householdCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current isChild Value</p>
                  <p className={niyahData.isChild ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {String(niyahData.isChild)} ({typeof niyahData.isChild})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={success ? "text-green-600 font-semibold" : "text-gray-600"}>
                    {success ? "Fixed ✓" : "Needs Fixing"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4">Could not find Niyah Dublin in the database</p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            onClick={findNiyah} 
            variant="outline"
            disabled={searchLoading}
          >
            {searchLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Refresh Data"
            )}
          </Button>
          
          {niyahData && (
            <Button 
              onClick={fixNiyahChildStatus} 
              disabled={loading || niyahData.isChild === true}
              className="bg-gold hover:bg-[#c19b2f] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : niyahData.isChild === true ? (
                "Already Set as Child"
              ) : (
                "Fix Child Status"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>This page is specifically for fixing Niyah Dublin's child status in the database.</li>
          <li>Click the "Fix Child Status" button to set Niyah's <code>isChild</code> field to <code>true</code>.</li>
          <li>After fixing, you should see the status change to "Fixed".</li>
          <li>Go back to the RSVP page and verify that Niyah now sees the correct child meal options.</li>
        </ol>
      </div>
    </div>
  )
} 