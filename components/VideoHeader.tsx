"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { images } from "../config/images"

const MotionDiv = motion.div
const MotionP = motion.p

interface VideoHeaderProps {
  isLocked: boolean
  onUnlock: () => void
}

interface YouTubeEvent {
  target: {
    playVideo: () => void
  }
  data?: number
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function VideoHeader({ isLocked, onUnlock }: VideoHeaderProps) {
  const [isClient, setIsClient] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {

    setIsClient(true)

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player("youtube-player", {
        events: {
          onReady: (event: YouTubeEvent) => {
            event.target.playVideo()
          },
          onStateChange: (event: YouTubeEvent) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              event.target.playVideo()
            }
          },
        },
      })
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "010424") {
      // Set isUnlocked in localStorage
      localStorage.setItem("isUnlocked", "true")
      // Dispatch storage event for the current window
      window.dispatchEvent(new Event('storage'))
      onUnlock()
    } else {
      setError("Incorrect password. Please try again.")
    }
  }

  if (!isClient) return null

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute inset-0">
        <iframe
          id="youtube-player"
          src="https://www.youtube.com/embed/G7GSu_MQM7Y?autoplay=1&mute=1&controls=0&loop=1&playlist=G7GSu_MQM7Y&showinfo=0&rel=0&version=3&playerapiid=ytplayer&enablejsapi=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
          style={{ pointerEvents: "none" }}
        />
      </div>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-6xl md:text-8xl font-cormorant font-bold mb-4 tracking-wider">
          <em>Sarah & Jermaine</em>
          </h1>
          <MotionP
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-2xl md:text-3xl font-montserrat tracking-widest mb-8"
          >
            Friday 24th October 2025

            </MotionP>
          {isLocked ? (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-md mx-auto"
            >
              <div className="relative w-64 h-64 mx-auto mb-6">
                <Image
                  src={images.couple.story3 || "/placeholder.svg"}
                  alt="Sarah and Jermaine"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <p className="text-xl font-montserrat mb-4">RSVP by 1st July</p>
              <p className="text-sm font-montserrat mb-6">
                Unfortunately, we cannot accommodate any children. Only the names on the invites will be permitted
                entry.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to unlock"
                  className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-gold transition-colors"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-gold text-black font-montserrat font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Unlock
                </button>
              </form>
            </MotionDiv>
            ) : (
            <MotionDiv
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            >
              <svg
              className="w-8 h-8 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </MotionDiv>
            )}
          </MotionDiv>
          </div>
        </div>
  )
}

