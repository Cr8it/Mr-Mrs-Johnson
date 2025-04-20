"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

const MotionH2 = motion.h2
const MotionH3 = motion.h3
const MotionDiv = motion.div

export default function Schedule() {
  const [settings, setSettings] = useState({
    weddingDate: null,
    venueName: '',
    venueAddress: '',
    ceremonyTime: '',
    receptionTime: ''
  })


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        if (data) {
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const events = [
    {
      time: settings.ceremonyTime || "12:30pm",
      title: "The Ceremony",
      emoji: "💍",
      details: [
        "Bridal Procession to begin 12:30 pm. Latecomers will not be permitted entry.",
        "Attire: Formal Attire.",
        settings.venueName && settings.venueAddress ? `${settings.venueName}, ${settings.venueAddress}` : "Venue TBD",
      ],
    },
    {
      time: "4:00pm",
      title: "Wedding Breakfast",
      emoji: "✨",
      details: [settings.venueName && settings.venueAddress ? `${settings.venueName}, ${settings.venueAddress}` : "Venue TBD"],
    },
    {
      time: settings.receptionTime || "7:30pm",
      title: "Evening Reception",
      emoji: "💃🏾",
      details: [settings.venueName && settings.venueAddress ? `${settings.venueName}, ${settings.venueAddress}` : "Venue TBD"],
    },
  ]

  const weddingDate = settings.weddingDate ? new Date(settings.weddingDate) : new Date("2025-10-24")
  const day = weddingDate.getDate()
  const formattedDate = weddingDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  }).replace(/\d+/, day + getOrdinalSuffix(day))

  return (
    <section id="schedule" className="py-32 relative">
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <MotionH2
          className="text-7xl font-cormorant font-bold text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Schedule
        </MotionH2>
        <MotionH3
          className="text-4xl font-cormorant font-semibold mb-20 text-center text-gold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {formattedDate}
        </MotionH3>
        <div className="space-y-16">
          {events.map((event, index) => (
            <MotionDiv
              key={event.title}
                className="relative bg-black/30 p-10 rounded-2xl border border-white/10 hover:border-gold/30 transition-all duration-300 group hover:bg-black/40 hover:shadow-xl hover:shadow-gold/5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-gradient-to-b from-gold via-gold/50 to-transparent rounded-full group-hover:h-32 group-hover:opacity-100 opacity-50 transition-all duration-300" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h4 className="text-4xl font-cormorant font-bold text-gold">
                  {event.time}
                </h4>
                <h5 className="text-2xl font-cormorant flex items-center gap-3">
                  {event.title} <span className="text-3xl">{event.emoji}</span>
                </h5>
              </div>
              <div className="space-y-3 pl-6 border-l border-white/10">
                {event.details.map((detail, detailIndex) => (
                    <p key={detailIndex} className="font-montserrat text-sm text-white/80">
                    {detail}
                  </p>
                ))}
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  )

}


