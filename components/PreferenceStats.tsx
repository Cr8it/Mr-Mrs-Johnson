"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface PreferenceOption {
	name: string
	count: number
}

interface PreferenceStatsProps {
	title: string
	options: PreferenceOption[]
	totalGuests: number
	colorClass: string
}

export function PreferenceStats({ title, options, totalGuests, colorClass }: PreferenceStatsProps) {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		setIsVisible(true)
	}, [])

	const maxCount = Math.max(...options.map(option => option.count))

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold text-gray-700">{title} Distribution</h3>
			<div className="space-y-3">
				{options.map((option) => (
					<div key={option.name} className="space-y-2">
						<div className="flex justify-between text-sm text-gray-600">
							<span>{option.name}</span>
							<span>{option.count} guests ({totalGuests > 0 ? Math.round((option.count / totalGuests) * 100) : 0}%)</span>
						</div>
						<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
							<motion.div
								className={`h-full ${colorClass}`}
								initial={{ width: 0 }}
								animate={{ width: isVisible ? `${(option.count / maxCount) * 100}%` : 0 }}
								transition={{ duration: 1, ease: "easeOut" }}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}