import { useState, useEffect } from 'react'

export function useRSVPState() {
	const [showRSVP, setShowRSVP] = useState(true)

	useEffect(() => {
		const hasRSVPed = localStorage.getItem('has-rsvped')
		if (hasRSVPed === 'true') {
			setShowRSVP(false)
		}
	}, [])

	const handleRSVPComplete = () => {
		localStorage.setItem('has-rsvped', 'true')
		setShowRSVP(false)
	}

	return {
		showRSVP,
		setShowRSVP,
		handleRSVPComplete
	}
}