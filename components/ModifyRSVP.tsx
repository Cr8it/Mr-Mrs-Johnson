"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface ModifyRSVPProps {
	onModify: () => void
}

export default function ModifyRSVP({ onModify }: ModifyRSVPProps) {
	return (
		<motion.div
			className="fixed top-4 right-4 z-50"
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
		>
			<Button
				onClick={onModify}
				className="bg-white text-black hover:bg-gray-200"
			>
				Modify RSVP
			</Button>
		</motion.div>
	)
}