import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInteracted = useRef(false)

  // Initialize audio and attempt autoplay
  useEffect(() => {
    const initializeAudio = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio('/background-music.mp3')
        audioRef.current.loop = true
        audioRef.current.volume = 0.6
      }

      const attemptPlay = async () => {
        try {
          if (audioRef.current) {
            await audioRef.current.play()
            setIsPlaying(true)
          }
        } catch (error) {
          console.log('Autoplay prevented, waiting for interaction')
          setIsPlaying(false)
        }
      }

      attemptPlay()
    }

    initializeAudio()

    // Add interaction listeners
    const handleInteraction = () => {
      if (!hasInteracted.current && audioRef.current) {
        hasInteracted.current = true
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => console.log('Play failed after interaction:', error))
      }
    }

    // Listen for any user interaction
    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Handle play state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Play prevented:', error)
            if (!hasInteracted.current) {
              setIsPlaying(false)
            }
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  const togglePlay = async () => {
    hasInteracted.current = true
    setIsPlaying(!isPlaying)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 right-4 z-[999999] bg-black/80 backdrop-blur-sm rounded-full p-3 flex items-center gap-2"
    >
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center text-white hover:text-gold transition-colors"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
    </motion.div>
  )
} 