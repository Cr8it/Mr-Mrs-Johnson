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
    
    // Check if attendance info is saved in localStorage
    const savedAttendance = localStorage.getItem('rsvp-attendance')
    if (savedAttendance) {
      try {
        const { allNotAttending: savedNotAttending } = JSON.parse(savedAttendance)
        setAllNotAttending(savedNotAttending)
      } catch (error) {
        console.error('Error parsing saved attendance:', error)
      }
    }
  }, [router])

  const handleRSVPComplete = (code: string) => {
    setIsConfirmed(true)
    setHasRSVPed(true)
    console.log(`RSVP completed with code: ${code}, allNotAttending: ${allNotAttending}`)
  }

  const handleClose = () => {
    console.log(`Closing modal - hasRSVPed: ${hasRSVPed}, allNotAttending: ${allNotAttending}`)
    // Only allow close if either:
    // 1. User has RSVPed and at least one person is attending, or
    // 2. Admin has forced close (not implemented here but could be added)
    if (hasRSVPed && !allNotAttending) {
      setIsOpen(false)
      setTimeout(() => {
        router.push("/")
      }, 300)
    } else {
      console.log('Cannot close modal - conditions not met')
    }
  }

  const handleRSVPStatus = (notAttending: boolean) => {
    console.log(`Setting allNotAttending to: ${notAttending}`)
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