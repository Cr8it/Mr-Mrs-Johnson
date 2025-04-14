"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react"

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  allowClose?: boolean;
  allNotAttending?: boolean;
}

const MotionDiv = motion.div

export default function Modal({ isOpen, onClose, children, allowClose = false, allNotAttending = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (onClose) {
      // Force the modal to close regardless of conditions
      document.body.style.overflow = 'unset';
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-50 overflow-y-auto"
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-4xl relative"
            >
              {/* Always show close button if onClose is provided and either not RSVPed or has RSVPed with attending guests */}
              {onClose && (!allowClose || (allowClose && !allNotAttending)) && (
                <button
                  onClick={handleClose}
                  className="fixed top-4 right-4 text-white hover:text-gray-300 z-[60] bg-black/50 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-black/70"
                >
                  Close
                </button>
              )}
              {children}
            </MotionDiv>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}



