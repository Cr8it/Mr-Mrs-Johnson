"use client"

import { motion } from "framer-motion"

const MotionP = motion.p

export default function Footer() {
  return (
    <footer className="bg-black/70 py-8 border-t border-white/10">
      <div className="container mx-auto px-4 text-center">
      <MotionP
        className="font-montserrat text-lg mb-4 text-white/90"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Together with Mr & Mrs Smith and Ms Wellington
      </MotionP>
      <MotionP
        className="font-montserrat text-sm text-gold hover:text-gold/80 transition-colors"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        Built By We CR8
      </MotionP>
      </div>
    </footer>
  );
}

