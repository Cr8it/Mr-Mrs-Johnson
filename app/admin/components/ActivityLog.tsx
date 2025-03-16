"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Activity {
	id: string
	action: string
	details: string
	createdAt: string
	guest: {
		name: string
		household: {
			name: string
		}
	}
}

interface ActivityLogProps {
	className?: string
}

function getActivityColor(action: string) {
	switch (action) {
		case 'RSVP_YES':
			return 'border-green-200 dark:border-green-800'
		case 'RSVP_NO':
			return 'border-red-200 dark:border-red-800'
		case 'GUEST_CREATED':
			return 'border-blue-200 dark:border-blue-800'
		case 'UPDATE_MEAL':
			return 'border-purple-200 dark:border-purple-800'
		case 'UPDATE_DESSERT':
			return 'border-pink-200 dark:border-pink-800'
		case 'UPDATE_DETAILS':
			return 'border-yellow-200 dark:border-yellow-800'
		default:
			return 'border-gray-200 dark:border-gray-700'
	}
}

function getActivityBadge(action: string) {
	switch (action) {
		case 'RSVP_YES':
			return { label: 'RSVP Yes', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' }
		case 'RSVP_NO':
			return { label: 'RSVP No', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' }
		case 'GUEST_CREATED':
			return { label: 'New Guest', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' }
		case 'UPDATE_MEAL':
			return { label: 'Meal Update', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' }
		case 'UPDATE_DESSERT':
			return { label: 'Dessert Update', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100' }
		case 'UPDATE_DETAILS':
			return { label: 'Details Update', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' }
		default:
			return { label: 'Activity', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' }
	}
}

export function ActivityLog({ className = "" }: ActivityLogProps) {
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchActivities = async () => {
			try {
				const response = await fetch('/api/admin/activities')
				const data = await response.json()
				
				if (data.success && Array.isArray(data.activities)) {
					setActivities(data.activities)
				} else {
					setError(data.error || 'Failed to load activities')
					setActivities([])
				}
			} catch (error) {
				console.error('Error fetching activities:', error)
				setError('Failed to load activities')
				setActivities([])
			} finally {
				setLoading(false)
			}
		}

		fetchActivities()
	}, [])

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-gold" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="text-center p-8 text-red-500 dark:text-red-400">
				{error}
			</div>
		)
	}

	if (!activities.length) {
		return (
			<div className="text-center p-8 text-gray-500 dark:text-gray-400">
				No activities to display
			</div>
		)
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{activities.map(activity => (
				<div 
					key={activity.id} 
					className={`rounded-lg border p-4 transition-all hover:shadow-md bg-white dark:bg-gray-800 ${getActivityColor(activity.action)}`}
				>
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="flex items-center gap-2 mb-1">
								<Badge className={getActivityBadge(activity.action).color}>
									{getActivityBadge(activity.action).label}
								</Badge>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
								</span>
							</div>
							<p className="font-medium text-gray-900 dark:text-gray-100">
								{activity.guest.name}
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{activity.guest.household.name}
							</p>
							{activity.details && (
								<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
									{activity.details}
								</p>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}