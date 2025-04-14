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
    // Only allow closing if:
    // 1. allowClose is true (has RSVPed) AND not everyone is not attending
    // 2. OR if allowClose is false (hasn't RSVPed yet)
    if (onClose && (allowClose ? !allNotAttending : true)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-4xl"
            >
              {/* Show close button if:
                  1. We have an onClose handler AND
                  2. Either allowClose is false (hasn't RSVPed) OR (has RSVPed AND not everyone is not attending) */}
              {onClose && (allowClose ? !allNotAttending : true) && (
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-black/50 px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              )}
              {children}
            </MotionDiv>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}



