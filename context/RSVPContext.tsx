"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as React from 'react';

interface RSVPContextType {
	isModifying: boolean;
	hasRSVPed: boolean;
	showRSVP: boolean;
	setShowRSVP: (show: boolean) => void;
	startModification: () => void;
	endModification: () => void;
}

const RSVPContext = createContext<RSVPContextType | undefined>(undefined);

export function RSVPProvider({ children }: { children: ReactNode }) {
	const [isModifying, setIsModifying] = useState(false);
	const [hasRSVPed, setHasRSVPed] = useState(false);
	const [showRSVP, setShowRSVP] = useState(false);
	const [isUnlocked, setIsUnlocked] = useState(false);
	const [rsvpBlocked, setRsvpBlocked] = useState(false);

	// Fetch RSVP blocked status on mount
	useEffect(() => {
		const fetchRsvpBlocked = async () => {
			try {
				const response = await fetch('/api/rsvp/blocked');
				const data = await response.json();
				setRsvpBlocked(data.rsvpBlocked || false);
			} catch (error) {
				setRsvpBlocked(false);
			}
		};
		fetchRsvpBlocked();
	}, []);

	// Effect to handle initial state and storage changes
	useEffect(() => {
		const checkStatus = () => {
			const unlocked = localStorage.getItem('isUnlocked') === 'true';
			const hasRSVPed = localStorage.getItem('has-rsvped') === 'true';
			const modifying = localStorage.getItem('modifying-rsvp') === 'true';
			const savedAttendance = localStorage.getItem('rsvp-attendance');

			setIsUnlocked(unlocked);
			setHasRSVPed(hasRSVPed);
			setIsModifying(modifying);

			// Show RSVP modal if:
			// 1. User is modifying their RSVP (modification always allowed)
			// 2. Page is unlocked and user hasn't RSVPed yet, and RSVPs are NOT blocked
			// 3. User has RSVPed but all guests are not attending (allow them to see the modal to update)
			if (modifying || (unlocked && !hasRSVPed && !rsvpBlocked) || (hasRSVPed && savedAttendance && JSON.parse(savedAttendance).allNotAttending)) {
				setShowRSVP(true);
			} else {
				setShowRSVP(false);
			}
		};

		// Check status immediately
		checkStatus();

		// Add event listener for storage changes
		const handleStorage = () => {
			checkStatus();
		};

		window.addEventListener('storage', handleStorage);
		document.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('storage', handleStorage);
			document.removeEventListener('storage', handleStorage);
		};

	}, [rsvpBlocked]);

	const startModification = () => {
		const rsvpCode = localStorage.getItem('rsvp-code');
		if (rsvpCode) {
			localStorage.removeItem(`rsvp-${rsvpCode}`);
			localStorage.setItem('modifying-rsvp', 'true');
			setIsModifying(true);
			setShowRSVP(true);
		}
	};

	const endModification = () => {
		localStorage.removeItem('modifying-rsvp');
		setIsModifying(false);
	};


	return (
		<RSVPContext.Provider
			value={{
				isModifying,
				hasRSVPed,
				showRSVP,
				setShowRSVP,
				startModification,
				endModification,
			}}
		>
			{children}
		</RSVPContext.Provider>
	);
}

export function useRSVP() {
	const context = useContext(RSVPContext);
	if (context === undefined) {
		throw new Error('useRSVP must be used within a RSVPProvider');
	}
	return context;
}