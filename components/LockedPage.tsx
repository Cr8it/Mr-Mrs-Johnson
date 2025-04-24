"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { images } from "../config/images"
import { useRouter } from "next/navigation"
// Define fallback paths
const FALLBACK_IMAGE_PATH = "/uploads/RINGWATCH.PNG"
const PLACEHOLDER_IMAGE_PATH = "/placeholder.jpg"

interface LockedPageProps {
  onUnlock: () => void
}

export default function LockedPage({ onUnlock }: LockedPageProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = () => {
      const isUnlocked = localStorage.getItem("isUnlocked") === "true";
      const rsvpStatus = localStorage.getItem("has-rsvped");
      const savedAttendance = localStorage.getItem('rsvp-attendance');
      const rsvpCode = localStorage.getItem('rsvp-code');
      const pathname = window.location.pathname;

      // Only perform attendance checks for wedding-info page
      if (pathname === '/wedding-info') {
        // Redirect if any required data is missing
        if (!isUnlocked || !rsvpStatus || !rsvpCode || !savedAttendance) {
          router.push('/');
          return;
        }

        try {
          const { allNotAttending } = JSON.parse(savedAttendance);
          if (allNotAttending) {
            router.push('/');
            return;
          }
        } catch (error) {
          // If there's any error parsing attendance data, redirect for security
          router.push('/');
          return;
        }
      }

      // For other pages, just check if unlocked
      if (isUnlocked) {
        onUnlock();
      }
    };

    // Run the check immediately and set up interval
    checkAccess();
    const securityInterval = setInterval(checkAccess, 1000);
    return () => clearInterval(securityInterval);
  }, [onUnlock, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "010424") {
      localStorage.setItem("isUnlocked", "true");
      // Dispatch storage event for the current window
      window.dispatchEvent(new Event('storage'));
      setPassword("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-black bg-opacity-70 p-4">
        <motion.div
          className="max-w-md w-full mx-auto p-6 sm:p-8 bg-black bg-opacity-70 backdrop-blur-md rounded-lg shadow-xl border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-4xl font-cormorant font-bold text-center mb-4 text-white">
            <em>Sarah and Jermaine</em>
          </h1>
          <p className="text-lg sm:text-xl font-montserrat text-center mb-6 text-white/90">Friday 24th October 2025</p>
          <div className="relative w-full h-52 sm:h-64 mb-6 shadow-lg">
            <Image
              src="/uploads/RINGWATCH.PNG"
              alt="Sarah and Jermaine"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              priority
              unoptimized={true}
              className="object-cover rounded-lg"
              onError={(e) => {
                // Fallback to standard HTML img tag for better compatibility
                console.log('Image failed to load, switching to fallback');
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite error loop
                target.src = PLACEHOLDER_IMAGE_PATH;
              }}
            />
          </div>
          <p className="text-base sm:text-lg font-montserrat text-center mb-4 text-white/90">RSVP by Sunday 22nd June '25</p>
          <p className="text-xs sm:text-sm font-montserrat text-center mb-6 text-white/80">
            Unfortunately, we cannot accommodate any children. Only named guests will be permitted entry.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to unlock"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-gold transition-colors text-white placeholder:text-white/50"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-gold text-black font-montserrat font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Unlock
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

