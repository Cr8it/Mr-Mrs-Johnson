"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface ToggleSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function ToggleSwitch({ checked, onCheckedChange, className }: ToggleSwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-12 w-[240px] cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-green-500/20 ring-2 ring-green-500" : "bg-red-500/20 ring-2 ring-red-500",
        className
      )}
      onClick={() => onCheckedChange(!checked)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-y-1 left-1 right-1 flex"
        animate={{ justifyContent: checked ? "flex-end" : "flex-start" }}
      >
        <motion.div
          className={cn(
            "h-10 w-[116px] rounded-full shadow-lg flex items-center justify-center",
            checked ? "bg-green-500" : "bg-red-500"
          )}
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          {checked ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <X className="h-5 w-5 text-white" />
          )}
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 flex justify-between items-center px-4 text-sm font-medium">
        <span className={cn(
          "ml-2",
          !checked ? "text-red-700 font-semibold" : "text-muted-foreground"
        )}>
          Not Attending
        </span>
        <span className={cn(
          "mr-2",
          checked ? "text-green-700 font-semibold" : "text-muted-foreground"
        )}>
          Attending
        </span>
      </div>
    </motion.button>
  )
} 