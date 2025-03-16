"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LockedPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted"); // Log when the form is submitted
    console.log("Entered password:", password); // Log the entered password
    console.log("Expected password:", process.env.NEXT_PUBLIC_UNLOCK_PASSWORD); // Log the expected password

    // Check if the password matches the expected password
    if (password === process.env.NEXT_PUBLIC_UNLOCK_PASSWORD) {
      console.log("Password is correct, redirecting to RSVP page..."); // Log successful password check
      // Redirect to the RSVP page if the password is correct
      router.push("/rsvp")
    } else {
      console.log("Incorrect password entered."); // Log incorrect password
      // Set an error message if the password is incorrect
      setError("Incorrect password. Please try again.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold">Unlock the RSVP</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password to unlock"
          className="w-full px-4 py-2 border rounded"
          required
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Unlock
        </button>
      </form>
    </div>
  )
} 