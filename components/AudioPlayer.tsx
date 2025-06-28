import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

// Storage key for play state
const PLAY_STATE_KEY = 'background-music-playing'

export default function AudioPlayer() {
  // Initialize playing state from localStorage if available
  const [isPlaying, setIsPlaying] = useState(true) // Always default to true
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInteracted = useRef(false)
  const helperAudioRef = useRef<HTMLAudioElement | null>(null)
  const playAttemptsRef = useRef(0)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Setup initial play state - but always favor autoplay
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get saved state but ignore "false" for initial page load
      const savedState = localStorage.getItem(PLAY_STATE_KEY)
      // Only respect saved state after user has explicitly paused
      if (savedState === 'false' && hasInteracted.current) {
        setIsPlaying(false)
      } else {
        setIsPlaying(true)
      }
    }
  }, [])

  // Save play state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PLAY_STATE_KEY, isPlaying ? 'true' : 'false')
  }, [isPlaying])

  // Silent audio trick to unlock audio context
  useEffect(() => {
    // Create a silent audio file - this helps unlock audio context
    if (!silentAudioRef.current) {
      silentAudioRef.current = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjMyLjEwNAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACAwCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAP/7kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgEBgIBgPB4JAIPB4PB4PB8IAgEAQCAIAgEAQCAIAgEAgEAgEAQCAIBAMAQDAgCAQCAQBgOBQCAQCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAIAAgACAAQBBAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV')
      silentAudioRef.current.play().catch(err => console.log('Silent audio init failed:', err))
    }
  }, [])

  // Initialize audio and attempt autoplay with more aggressive approach
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
          document.body.appendChild(audioRef.current) // Attach to DOM
        }
      }

      // More aggressive attempt pattern
      const attemptPlay = async () => {
        try {
          if (audioRef.current && isPlaying) {
            playAttemptsRef.current += 1
            const attempt = playAttemptsRef.current
            
            // Calculate delay with exponential backoff (but cap at 2000ms)
            const delay = Math.min(200 * Math.pow(1.5, attempt - 1), 2000)
            
            console.log(`Attempt ${attempt} to play audio with ${delay}ms delay`)
            
            // Try both muted and unmuted approaches
            const tryPlayback = async () => {
              try {
                if (audioRef.current && isPlaying) {
                  // Try with muted first (more likely to succeed)
                  audioRef.current.muted = true
            await audioRef.current.play()
                  
                  // Then quickly unmute
                  setTimeout(() => {
                    if (audioRef.current && isPlaying) {
                      audioRef.current.muted = false
                    }
                  }, 100)
                  
                  // Also try helper audio
                  if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
                    helperAudioRef.current.play().catch(() => {})
                  }
                  console.log(`Successfully played audio on attempt ${attempt}`)
                }
              } catch (error) {
                throw error
              }
            }
            
            setTimeout(async () => {
              try {
                await tryPlayback()
              } catch (error) {
                console.log(`Delayed autoplay attempt ${attempt} prevented:`, error)
                
                // Try another attempt if we haven't made too many
                if (attempt < 10) { // Increase max attempts
                  attemptPlay()
                }
              }
            }, delay)
          }
        } catch (error) {
          console.log('Autoplay prevented, waiting for interaction:', error)
        }
      }

      // Start multiple attempts at different times
      attemptPlay()
      setTimeout(attemptPlay, 500)
      setTimeout(attemptPlay, 1000)
      setTimeout(attemptPlay, 2000)
    }

    initializeAudio()

    // Add interaction listeners - capture phase for earliest possible handling
    const handleInteraction = () => {
      if (!hasInteracted.current && audioRef.current) {
        hasInteracted.current = true
        
        // Try to play both audio elements for redundancy
        const startPlayback = async () => {
          try {
            // Play silent audio first
            if (silentAudioRef.current) {
              await silentAudioRef.current.play()
            }
            
            // Then try the actual music
            audioRef.current!.muted = false
            await audioRef.current!.play()
            setIsPlaying(true)
            
            // If we have a separate helper audio, make sure it's playing too
            if (helperAudioRef.current && helperAudioRef.current !== audioRef.current) {
              helperAudioRef.current.play().catch(err => console.log('Helper audio play failed', err))
            }
          } catch (error) {
            console.log('Play failed after interaction:', error)
          }
        }
        
        startPlayback()
      }
    }

    // Listen for any user interaction with capture to get it early
    window.addEventListener('click', handleInteraction, { once: true, capture: true })
    window.addEventListener('touchstart', handleInteraction, { once: true, capture: true })
    window.addEventListener('keydown', handleInteraction, { once: true, capture: true })
    window.addEventListener('scroll', handleInteraction, { once: true, capture: true })

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
            // Don't set isPlaying to false automatically anymore
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