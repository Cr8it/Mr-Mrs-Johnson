import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

// Storage key for play state
const PLAY_STATE_KEY = 'background-music-playing'

export default function AudioPlayer() {
  // Initialize playing state from localStorage if available
  const [isPlaying, setIsPlaying] = useState(() => {
    // Get saved state if in browser environment
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(PLAY_STATE_KEY)
      return savedState !== 'false' // Default to true unless explicitly set to false
    }
    return true
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInteracted = useRef(false)
  const helperAudioRef = useRef<HTMLAudioElement | null>(null)
  const playAttemptsRef = useRef(0)

  // Save play state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PLAY_STATE_KEY, isPlaying ? 'true' : 'false')
  }, [isPlaying])

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

      // Make multiple attempts to play with increasing delays
      const attemptPlay = async () => {
        try {
          if (audioRef.current && isPlaying) {
            playAttemptsRef.current += 1
            const attempt = playAttemptsRef.current
            
            // Calculate delay with exponential backoff (but cap at 5000ms)
            const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000)
            
            console.log(`Attempt ${attempt} to play audio with ${delay}ms delay`)
            
            setTimeout(async () => {
              try {
                if (audioRef.current && isPlaying) {
                  // Try playing both audio elements for redundancy
                  await audioRef.current.play()
                  if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
                    await helperAudioRef.current.play()
                  }
                  console.log(`Successfully played audio on attempt ${attempt}`)
                }
              } catch (error) {
                console.log(`Delayed autoplay attempt ${attempt} prevented:`, error)
                
                // Try another attempt if we haven't made too many
                if (attempt < 5) {
                  attemptPlay()
                } else {
                  setIsPlaying(false)
                }
              }
            }, delay)
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

    // Handle page visibility changes to resume music on tab focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && audioRef.current) {
        console.log('Page became visible, resuming audio')
        audioRef.current.play()
          .catch(err => console.log('Resume on visibility change failed:', err))
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Don't pause on unmount - we want the music to continue during page navigation
      // This is crucial for maintaining playback during client-side navigation
    }
  }, [isPlaying])

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