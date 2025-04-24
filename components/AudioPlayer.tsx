import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInteracted = useRef(false)
  const helperAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio and attempt autoplay
  useEffect(() => {
    // Try to get the helper audio element from the DOM
    helperAudioRef.current = document.getElementById('backgroundMusicHelper') as HTMLAudioElement
    
    const initializeAudio = () => {
      if (!audioRef.current) {
        // Use the helper audio if available, otherwise create a new Audio object
        if (helperAudioRef.current) {
          audioRef.current = helperAudioRef.current
        } else {
          audioRef.current = new Audio('/background-music.mp3')
          audioRef.current.loop = true
          audioRef.current.volume = 0.6
          audioRef.current.autoplay = true
          audioRef.current.muted = false
        }
      }

      const attemptPlay = async () => {
        try {
          if (audioRef.current) {
            // Small delay before attempting to play
            setTimeout(async () => {
              try {
                if (audioRef.current) {
                  // Try playing both audio elements for redundancy
                  await audioRef.current.play()
                  if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
                    await helperAudioRef.current.play()
                  }
                  setIsPlaying(true)
                }
              } catch (error) {
                console.log('Delayed autoplay prevented:', error)
                setIsPlaying(false)
              }
            }, 1000)
          }
        } catch (error) {
          console.log('Autoplay prevented, waiting for interaction:', error)
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
        audioRef.current.muted = false
        
        // Try to play both audio elements for redundancy
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true)
            // If we have a separate helper audio, make sure it's playing too
            if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
              helperAudioRef.current.play().catch(err => console.log('Helper audio play failed', err))
            }
          })
          .catch(error => console.log('Play failed after interaction:', error))
      }
    }

    // Listen for any user interaction
    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })
    window.addEventListener('scroll', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
        helperAudioRef.current.pause()
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
          
          // Also play the helper audio if it's a separate element
          if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
            helperAudioRef.current.play().catch(err => console.log('Helper toggle failed', err))
          }
        }
      } else {
        audioRef.current.pause()
        // Also pause the helper audio if it's a separate element
        if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
          helperAudioRef.current.pause()
        }
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