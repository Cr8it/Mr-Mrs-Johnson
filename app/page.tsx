"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Navigation from "../components/Navigation"
import Modal from "@/components/Modal"
import RSVP from "@/components/RSVP"
import ModifyRSVP from "@/components/ModifyRSVP"
import OurStory from "../components/OurStory"
import Schedule from "../components/Schedule"
import DreamTeam from "../components/DreamTeam"
import Footer from "../components/Footer"
import { CountdownTimer } from "../components/CountdownTimer"
import AnimatedBackground from "../components/AnimatedBackground"
import PhotoGallery from "../components/PhotoGallery"
import { useRSVP } from "@/context/RSVPContext"

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
}

export default function Home() {
  const { showRSVP, setShowRSVP, hasRSVPed, startModification } = useRSVP()
  const [allNotAttending, setAllNotAttending] = useState(false)
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        if (data && data.weddingDate) {
          setWeddingDate(new Date(data.weddingDate));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

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
    // Remove the setShowRSVP(false) call to allow the thank you message to show
  };

  const handleRSVPStatus = (notAttending: boolean) => {
    setAllNotAttending(notAttending);
    localStorage.removeItem('modifying-rsvp');
  };


  const handleModalClose = () => {
    if (hasRSVPed) {
      setShowRSVP(false);
    }
  };

  return (
    <motion.main className="min-h-screen relative" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
        <AnimatedBackground />
        {weddingDate && <CountdownTimer weddingDate={weddingDate} />}
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


