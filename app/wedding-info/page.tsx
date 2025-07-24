"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from 'next/navigation'
import Modal from "@/components/Modal"
import RSVP from "@/components/RSVP"
import ModifyRSVP from "@/components/ModifyRSVP"
import Navigation from "../../components/Navigation"
import OurStory from "../../components/OurStory"
import Schedule from "../../components/Schedule"
import DreamTeam from "../../components/DreamTeam"
import Footer from "../../components/Footer"
import { CountdownTimer } from "../../components/CountdownTimer"
import AnimatedBackground from "../../components/AnimatedBackground"
import PhotoGallery from "../../components/PhotoGallery"
import { useRSVP } from "@/context/RSVPContext"

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
}

export default function WeddingInfoPage() {
  const router = useRouter()
  const { showRSVP, setShowRSVP, hasRSVPed, startModification } = useRSVP()
  const [allNotAttending, setAllNotAttending] = useState(false)
  const [settings, setSettings] = useState<{
    weddingDate: string | null;
    venueName: string;
    venueAddress: string;
    backgroundImage: string;
  }>({
    weddingDate: null,
    venueName: '',
    venueAddress: '',
    backgroundImage: ''
  });

  // Add effect to handle unlocking
  useEffect(() => {
    const handleUnlock = () => {
      const isUnlocked = localStorage.getItem('isUnlocked') === 'true';
      const hasRSVPed = localStorage.getItem('has-rsvped') === 'true';
      
      if (isUnlocked && !hasRSVPed) {
        setShowRSVP(true);
      }
    };

    // Check on mount and listen for storage events
    handleUnlock();
    window.addEventListener('storage', handleUnlock);
    document.addEventListener('storage', handleUnlock);

    return () => {
      window.removeEventListener('storage', handleUnlock);
      document.removeEventListener('storage', handleUnlock);
    };
  }, [setShowRSVP]);

  const handleModifyClick = () => {
    const rsvpCode = localStorage.getItem('rsvp-code');
    if (rsvpCode) {
      localStorage.removeItem(`rsvp-${rsvpCode}`);
      localStorage.setItem('modifying-rsvp', 'true');
      startModification();
    }
  };

  const handleRSVPComplete = (code: string) => {
    localStorage.setItem('has-rsvped', 'true');
    localStorage.setItem('isUnlocked', 'true');
  };

  const handleRSVPStatus = (notAttending: boolean) => {
    setAllNotAttending(notAttending);
    localStorage.removeItem('modifying-rsvp');
  };


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        if (data) {
            setSettings({
            weddingDate: data.weddingDate,
            venueName: data.venueName,
            venueAddress: data.venueAddress,
            backgroundImage: data.backgroundImage || ''
            });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const checkAccess = () => {
      const unlocked = localStorage.getItem("isUnlocked") === "true";
      const rsvpStatus = localStorage.getItem("has-rsvped");
      const savedAttendance = localStorage.getItem('rsvp-attendance');
      const rsvpCode = localStorage.getItem('rsvp-code');
      
      // Only require RSVP completion and at least one attending
      if (!unlocked || !rsvpStatus || !rsvpCode || !savedAttendance) {
        router.push('/');
        return;
      }

      try {
        const { allNotAttending: savedNotAttending } = JSON.parse(savedAttendance);
        setAllNotAttending(savedNotAttending);
        
        // If all guests are not attending, redirect
        if (savedNotAttending) {
          router.push('/');
          return;
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkAccess();
    const securityInterval = setInterval(checkAccess, 1000);
    return () => clearInterval(securityInterval);
  }, [router]);

  const handleModalClose = () => {
    if (hasRSVPed && !allNotAttending) {
      setShowRSVP(false);
    }
  };

  return (
    <motion.main 
      className="min-h-screen relative isolate"
      initial="initial" 
      animate="animate" 
      exit="exit" 
      variants={pageVariants}
        style={settings.backgroundImage ? {
        backgroundImage: `url(${settings.backgroundImage})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
        } : undefined}
    >
        {settings.backgroundImage ? (
        <div className="fixed inset-0 bg-black/50 -z-10" />
        ) : (
        <AnimatedBackground />
        )}
      <div className="relative z-0">
      {settings.weddingDate && (
        <CountdownTimer weddingDate={new Date(settings.weddingDate)} />
      )}
      <Navigation onRSVPClick={() => setShowRSVP(true)} />

      {hasRSVPed && (
        <ModifyRSVP onModify={handleModifyClick} />
      )}

      <div className="container mx-auto px-4">
        <OurStory />
        <Schedule />
        <DreamTeam />
        <PhotoGallery />
      </div>
      <Footer />
      </div>

      <Modal 
        isOpen={showRSVP} 
        onClose={handleModalClose}
        allowClose={hasRSVPed}
        allNotAttending={allNotAttending}
      >
        <RSVP 
          onComplete={handleRSVPComplete}
          onRSVPStatus={handleRSVPStatus}
        />
      </Modal>
    </motion.main>
  )
}

