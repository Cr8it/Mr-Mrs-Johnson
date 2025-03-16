"use client"

import { useEffect, useState } from "react"
import { useSpring, animated, config } from "@react-spring/web"

interface CounterProps {
	value: number
	duration?: number
	suffix?: string
}

export default function CounterAnimation({ value, duration = 1500, suffix = "" }: CounterProps) {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		setIsVisible(true)
	}, [])

	const { number } = useSpring({
		from: { number: 0 },
		number: isVisible ? value : 0,
		delay: 100,
		config: { ...config.molasses, duration }
	})

	return (
		<animated.span className="inline-block">
			{number.to((n) => `${Math.floor(n)}${suffix}`)}
		</animated.span>
	)
}