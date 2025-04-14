"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RSVP from "@/components/RSVP"
import Modal from "@/components/Modal"

export default function RsvpPage() {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [hasRSVPed, setHasRSVPed] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [allNotAttending, setAllNotAttending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkRsvpStatus = async () => {
      const response = await fetch("/api/rsvp/check-status")
      const data = await response.json()

      if (data.isConfirmed) {
        setIsConfirmed(true)
        router.push("/")
      }
    }

    checkRsvpStatus()
  }, [router])

  const handleRSVPComplete = (code: string) => {
    setIsConfirmed(true)
    setHasRSVPed(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      router.push("/")
    }, 300)
  }

  const handleRSVPStatus = (notAttending: boolean) => {
    setAllNotAttending(notAttending)
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        allowClose={hasRSVPed}
        allNotAttending={allNotAttending}
      >
        <RSVP 
          onComplete={handleRSVPComplete} 
          onClose={handleClose}
          onRSVPStatus={handleRSVPStatus}
        />
      </Modal>
    </div>
  )
}