"use client"

import { motion } from "framer-motion"
import GuestList from "../components/GuestList"

export default function GuestsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GuestList />
    </motion.div>
  )
} 