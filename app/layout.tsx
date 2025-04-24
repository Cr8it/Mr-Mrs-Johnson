"use client"

import { useEffect, useState } from "react"
import "./globals.css"
import { Cormorant_Garamond, Montserrat } from "next/font/google"
import VideoHeader from "../components/VideoHeader"
import LockedPage from "@/components/LockedPage"
import { usePathname, useRouter } from "next/navigation"
import { RSVPProvider } from "@/context/RSVPContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import AudioPlayer from "@/components/AudioPlayer"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
})
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [settings, setSettings] = useState({
    backgroundImage: '',
    primaryColor: '#d4af37',
    accentColor: '#000000'
  })
  const pathname = usePathname()
  const router = useRouter()
  const isAdminRoute = pathname?.startsWith('/admin')

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

  useEffect(() => {
    const checkAccess = () => {
      const unlockState = localStorage.getItem("isUnlocked");
      if (unlockState === "true") {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    };

    // Check access initially
    checkAccess();

    // Add storage event listener for changes from other tabs/windows
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "isUnlocked") {
        checkAccess();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorage);

    // Set up interval for periodic checks
    const securityInterval = setInterval(checkAccess, 1000);

    return () => {
      clearInterval(securityInterval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [pathname, router]);

  const handleUnlock = () => {
    setIsUnlocked(true);
    localStorage.setItem("isUnlocked", "true");
    // Dispatch storage event for the current window
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <html lang="en">
        <body 
          className={`${cormorant.variable} ${montserrat.variable} font-sans bg-black text-white relative`}
          style={settings.backgroundImage ? {
          backgroundImage: `url(${settings.backgroundImage})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
          } : undefined}
          suppressHydrationWarning
        >
          {/* Hidden audio element to help with autoplay policies - always present regardless of locked state */}
          <audio 
            id="backgroundMusicHelper" 
            src="/background-music.mp3" 
            loop 
            autoPlay 
            playsInline 
            preload="auto"
            muted={false}
            style={{ display: 'none' }} 
          />
          
          {settings.backgroundImage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] -z-10" />
          )}
          <div className="relative z-0">
          <TooltipProvider>
            <RSVPProvider>
            <AudioPlayer />
            {isAdminRoute ? (
              children
            ) : (
              <>
              <VideoHeader isLocked={!isUnlocked} onUnlock={handleUnlock} />
              {!isUnlocked ? (
                <div className="fixed inset-0 z-50">
                <LockedPage onUnlock={handleUnlock} />
                </div>
              ) : (
                <>
                {children}
                </>
              )}
              </>
            )}
            </RSVPProvider>
          </TooltipProvider>
          </div>
        </body>
    </html>
  )
}



