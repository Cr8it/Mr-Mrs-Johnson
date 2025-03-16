"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { 
	CheckCircle2, 
	XCircle, 
	Clock, 
	Mail, 
	Calendar, 
	User, 
	Settings,
	AlertCircle,
	Loader2
} from "lucide-react"

interface Activity {
	id: string
	action: string
	details: string | null
	createdAt: string
	guest: {
		name: string
		household: {
			name: string
		}
	}
}

const getActivityIcon = (action: string) => {
	switch (action.toLowerCase()) {
		case 'rsvp_confirmed': return <CheckCircle2 className="h-5 w-5 text-green-500" />
		case 'rsvp_declined': return <XCircle className="h-5 w-5 text-red-500" />
		case 'rsvp_pending': return <Clock className="h-5 w-5 text-orange-500" />
		case 'email_sent': return <Mail className="h-5 w-5 text-blue-500" />
		case 'guest_updated': return <User className="h-5 w-5 text-purple-500" />
		case 'date_changed': return <Calendar className="h-5 w-5 text-indigo-500" />
		default: return <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
	}
}

const getActivityColor = (action: string) => {
	switch (action.toLowerCase()) {
		case 'rsvp_confirmed': return 'bg-green-50 border-green-100'
		case 'rsvp_declined': return 'bg-red-50 border-red-100'
		case 'rsvp_pending': return 'bg-orange-50 border-orange-100'
		case 'email_sent': return 'bg-blue-50 border-blue-100'
		case 'guest_updated': return 'bg-purple-50 border-purple-100'
		case 'date_changed': return 'bg-indigo-50 border-indigo-100'
		default: return 'bg-gray-50 border-gray-100'
	}
}

export function ActivityLog({ className = "" }: { className?: string }) {
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchActivities = async () => {
			try {
				const response = await fetch('/api/admin/activities')
				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.error || 'Failed to fetch activities')
				}
				const data = await response.json()
				setActivities(data)
				setError(null)
			} catch (error) {
				setError(error instanceof Error ? error.message : 'Failed to fetch activities')
			} finally {
				setLoading(false)
			}
		}

		fetchActivities()
		const interval = setInterval(fetchActivities, 60000)
		return () => clearInterval(interval)
	}, [])

	const formatAction = (action: string) => {
		return action.split('_').map(word => 
			word.charAt(0) + word.slice(1).toLowerCase()
		).join(' ')
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-gold" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-[400px] text-red-500">
				<AlertCircle className="h-6 w-6 mr-2" />
				<span>Error: {error}</span>
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
					<div className="flex items-start gap-4">
						<div className="mt-1">
							{getActivityIcon(activity.action)}
						</div>
						<div className="flex-1 space-y-1">
							<div className="flex items-center justify-between">
								<p className="font-medium text-gray-900 dark:text-gray-100">{activity.guest.name}</p>
								<time className="text-sm text-gray-500 dark:text-gray-400">
									{format(new Date(activity.createdAt), 'MMM d, h:mm a')}
								</time>
							</div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								from {activity.guest.household.name}
							</p>
							<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{formatAction(activity.action)}
								{activity.details && (
									<span className="text-gray-500 dark:text-gray-400"> - {activity.details}</span>
								)}
							</p>
						</div>
					</div>
				</div>
			))}
			{activities.length === 0 && (
				<div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
					<Calendar className="h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
					<p className="text-lg font-medium dark:text-gray-300">No activities recorded yet</p>
					<p className="text-sm">Recent guest activities will appear here</p>
				</div>
			)}
		</div>
	)
}