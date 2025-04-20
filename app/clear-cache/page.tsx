"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClearCachePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState("")
  const router = useRouter()

  const clearCache = async () => {
    try {
      setStatus('loading')
      setMessage("Clearing server cache...")
      
      // Call the cache clearing API endpoint
      const response = await fetch(`/api/clear-cache?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage("Server cache cleared. Clearing browser cache...")
        
        // Force router refresh to clear client-side Next.js cache
        router.refresh()
        
        // Clear localStorage
        localStorage.clear()
        
        // Clear sessionStorage
        sessionStorage.clear()
        
        // Force service worker to update if present
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.update()
          }
        }
        
        setStatus('success')
        setMessage("All caches successfully cleared!")
      } else {
        throw new Error(data.message || "Failed to clear cache")
      }
    } catch (error) {
      console.error("Cache clearing error:", error)
      setStatus('error')
      setMessage(`Error clearing cache: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  useEffect(() => {
    // Auto-clear cache on page load
    clearCache()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Cache Management</h1>
        
        <div className="text-center mb-6">
          {status === 'loading' && (
            <div className="animate-pulse">
              <div className="h-12 w-12 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-700">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="mt-4">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="mt-4">{message}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={clearCache}
            disabled={status === 'loading'}
            className={`px-4 py-2 rounded-md text-white ${
              status === 'loading' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Clear Cache Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Return to Homepage
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>This page clears:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Server-side Next.js cache</li>
            <li>Client-side Next.js cache</li>
            <li>Browser localStorage and sessionStorage</li>
            <li>Service Worker cache (if present)</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 