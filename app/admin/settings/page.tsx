"use client"

import { useState, useEffect } from "react"
import { Calendar, Save, Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
	const [settings, setSettings] = useState({
		weddingDate: "",
		venueName: "",
		venueAddress: "",
		receptionTime: "",
		ceremonyTime: "",
		primaryColor: "#d4af37", // Default gold color
		accentColor: "#000000",
		backgroundImage: "",
		showGallery: true,
		rsvpBlocked: false
	})
	const [loading, setLoading] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = await fetch('/api/admin/settings')
				const data = await response.json()
				if (data) {
					setSettings({
						...data,
						weddingDate: data.weddingDate ? new Date(data.weddingDate).toISOString().slice(0, 16) : "",
					})
				}
			} catch (error) {
				console.error('Error fetching settings:', error)
			}
		}
		fetchSettings()
	}, [])

	const handleSave = async () => {
		setLoading(true)
		try {
			const formattedSettings = {
				...settings,
				weddingDate: settings.weddingDate ? new Date(settings.weddingDate).toISOString() : null
			}
			
			const response = await fetch('/api/admin/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formattedSettings)
			})
			
			if (!response.ok) {
				throw new Error('Failed to save settings')
			}

			console.log('Settings saved successfully')
		} catch (error) {
			console.error('Error saving settings:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			setIsUploading(true)
			setUploadError(null)
			const formData = new FormData()
			formData.append('file', file)

			const response = await fetch('/api/admin/upload-image', {
				method: 'POST',
				body: formData,
			})

			const data = await response.json()
			if (data.success) {
				setSettings(prev => ({ ...prev, backgroundImage: data.imageUrl }))
			} else {
				setUploadError(data.error || 'Failed to upload image')
			}
		} catch (error) {
			console.error('Error uploading image:', error)
			setUploadError('Failed to upload image. Please try again.')
		} finally {
			setIsUploading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Settings</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Manage your wedding website settings
					</p>
				</div>
				<Button onClick={handleSave} disabled={loading} className="bg-gold hover:bg-[#c19b2f] text-white">
					<Save className="mr-2 h-4 w-4" />
					Save Changes
				</Button>
			</div>

			<Tabs defaultValue="general" className="space-y-4">
				<TabsList className="bg-gray-100 dark:bg-gray-800">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="appearance">Appearance</TabsTrigger>
					<TabsTrigger value="notifications">Notifications</TabsTrigger>
				</TabsList>

				<TabsContent value="general">
					<Card>
						<CardHeader>
							<CardTitle>Wedding Details</CardTitle>
							<CardDescription>
								Configure the main details about your wedding
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>Wedding Date</Label>
									<div className="relative">
										<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
										<Input
											type="datetime-local"
											value={settings.weddingDate}
											onChange={(e) => setSettings({ ...settings, weddingDate: e.target.value })}
											className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Ceremony Time</Label>
									<Input
										type="time"
										value={settings.ceremonyTime}
										onChange={(e) => setSettings({ ...settings, ceremonyTime: e.target.value })}
										className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Venue Name</Label>
								<Input
									value={settings.venueName}
									onChange={(e) => setSettings({ ...settings, venueName: e.target.value })}
									className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
								/>
							</div>

							<div className="space-y-2">
								<Label>Venue Address</Label>
								<Input
									value={settings.venueAddress}
									onChange={(e) => setSettings({ ...settings, venueAddress: e.target.value })}
									className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
								/>
							</div>

							<div className="flex items-center justify-between border-t pt-4">
								<div className="space-y-0.5">
									<Label>Show Photo Gallery</Label>
									<p className="text-sm text-muted-foreground">
										Toggle visibility of the "Our Journey in Pictures" section
									</p>
								</div>
								<Switch
									checked={settings.showGallery}
									onCheckedChange={(checked) => setSettings({ ...settings, showGallery: checked })}
									className="data-[state=checked]:bg-gold"
								/>
							</div>

							<div className="flex items-center justify-between border-t pt-4">
								<div className="space-y-0.5">
									<Label>Block RSVP Submissions</Label>
									<p className="text-sm text-muted-foreground">
										When enabled, guests will not be able to submit RSVPs and will see a message instead
									</p>
								</div>
								<Switch
									checked={settings.rsvpBlocked}
									onCheckedChange={(checked) => setSettings({ ...settings, rsvpBlocked: checked })}
									className="data-[state=checked]:bg-red-500"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="appearance">
					<Card>
						<CardHeader>
							<CardTitle>Theme Settings</CardTitle>
							<CardDescription>
								Customize the look of your wedding website
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>Primary Color</Label>
									<div className="flex gap-2">
										<Input
											type="color"
											value={settings.primaryColor}
											onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
											className="w-20 h-10 p-1 dark:bg-gray-800 dark:border-gray-700"
										/>
										<Input
											value={settings.primaryColor}
											onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
											className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Accent Color</Label>
									<div className="flex gap-2">
										<Input
											type="color"
											value={settings.accentColor}
											onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
											className="w-20 h-10 p-1 dark:bg-gray-800 dark:border-gray-700"
										/>
										<Input
											value={settings.accentColor}
											onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
											className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
										/>
									</div>
								</div>
							</div>

							<div className="space-y-2 pt-4 border-t">
								<Label>Background Pattern</Label>
								<div className="flex items-start gap-4">
									<div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-gold transition-colors">
										{settings.backgroundImage ? (
											<>
												<Image
													src={settings.backgroundImage}
													alt="Background pattern"
													fill
													className="object-cover"
												/>
												<button
													type="button"
													onClick={() => setSettings(prev => ({ ...prev, backgroundImage: '' }))}
													className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-600/80"
												>
													<X size={14} />
												</button>
											</>
										) : (
											<label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
												<ImageIcon size={24} className="text-gray-400" />
												<span className="text-xs text-gray-500 mt-2">Upload Pattern</span>
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleImageUpload}
													disabled={isUploading}
												/>
											</label>
										)}
										{isUploading && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/50">
												<Upload className="animate-bounce text-white" />
											</div>
										)}
									</div>
									<div className="flex-1">
										<p className="text-sm text-gray-500">
											Upload a pattern image that will be repeated across the page background.
											For best results, use a seamless pattern.
										</p>
										{uploadError && (
											<p className="text-red-500 text-sm mt-2">{uploadError}</p>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="notifications">
					<Card>
						<CardHeader>
							<CardTitle>Notification Settings</CardTitle>
							<CardDescription>
								Configure email notifications and reminders
							</CardDescription>
						</CardHeader>
						<CardContent>
							{/* Add notification settings here */}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}