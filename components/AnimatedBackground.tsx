"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  radius: number
  speed: number
  angle: number
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []
    const particleCount = 100

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * 360,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgba(212, 175, 55, 0.1)" // Gold color with low opacity

      particles.forEach((particle) => {
        particle.x += Math.cos(particle.angle) * particle.speed
        particle.y += Math.sin(particle.angle) * particle.speed

        if (particle.x < 0 || particle.x > canvas.width) particle.angle = Math.PI - particle.angle
        if (particle.y < 0 || particle.y > canvas.height) particle.angle = -particle.angle

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
}

