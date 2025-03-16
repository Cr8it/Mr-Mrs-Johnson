"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (username === "JandSAdmin" && password === "Thelordismyshepard12") {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })

        if (response.ok) {
          router.push("/admin")
        } else {
          throw new Error("Login failed")
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to log in. Please try again.",
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid credentials",
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div
        className="w-full max-w-md p-8 bg-white bg-opacity-5 backdrop-blur-sm rounded-lg border border-white border-opacity-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white text-center mb-8">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400"
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Check credentials
    if (username === "JandSAdmin" && password === "Thelordismyshepard12") {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })

        if (response.ok) {
          router.push("/admin")
        } else {
          throw new Error("Login failed")
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to log in. Please try again.",
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid credentials",
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div
        className="w-full max-w-md p-8 bg-white bg-opacity-5 backdrop-blur-sm rounded-lg border border-white border-opacity-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white text-center mb-8">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400"
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-white border-opacity-20 text-white placeholder-gray-400"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}


