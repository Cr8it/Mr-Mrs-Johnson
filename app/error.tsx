'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-6xl font-cormorant font-bold text-gold mb-4">500</h1>
        <h2 className="text-2xl font-montserrat text-white mb-8">Something went wrong!</h2>
        <p className="text-gray-400 mb-8">We apologize for the inconvenience.</p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block px-6 py-3 bg-gold text-white rounded-lg font-montserrat text-sm transition-transform hover:scale-105"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-block px-6 py-3 border border-gold text-gold rounded-lg font-montserrat text-sm transition-transform hover:scale-105"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  )
} 