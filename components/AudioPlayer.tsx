import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/background-music.mp3')
    audioRef.current.loop = true
    audioRef.current.volume = 0.6
    
    // Start playing automatically
    audioRef.current.play().catch(error => {
      console.log('Auto-play prevented:', error)
      setIsPlaying(false)
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-full p-3 flex items-center gap-2"
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