"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface CountdownTimerProps {
  weddingDate: Date;
  variant?: 'admin' | 'main';
}

export function CountdownTimer({ weddingDate, variant = 'main' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    if (!weddingDate || isNaN(weddingDate.getTime())) {
      return
    }

    const timer = setInterval(() => {
      const difference = weddingDate.getTime() - new Date().getTime()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [weddingDate])

  if (!weddingDate || isNaN(weddingDate.getTime())) {
    return null
  }

  const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
    if (!value) {
      return null
    }

    return (
      <div key={interval} className="flex flex-col items-center">
        <motion.span
          className="text-4xl md:text-6xl font-bold font-cormorant"
          key={value}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.span>
        <span className="text-sm md:text-base font-montserrat">{interval}</span>
      </div>
    )
  })

  const containerClasses = variant === 'admin' 
    ? 'py-6' 
    : 'py-12 bg-black/30';

  return (
    <div className={containerClasses}>
      {variant === 'main' && (
        <h2 className="text-3xl md:text-4xl font-cormorant font-bold text-center mb-8 text-white">
          Countdown to Our Big Day
        </h2>
      )}
      <div className="flex justify-center space-x-4 md:space-x-8">
        {timerComponents.length ? timerComponents : (
          <span className="text-2xl font-cormorant text-white">The big day is here!</span>
        )}
      </div>
    </div>
  )
}


