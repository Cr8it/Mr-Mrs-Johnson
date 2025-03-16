"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Questions from "../components/Questions"

export default function QuestionsPage() {
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = document.cookie.includes('adminAuthenticated=true')
    if (!isAuthenticated) {
      router.push('/admin/login')
    }
  }, [router])

  return (
    <div className="p-8">
      <Questions />
    </div>
  )
}
