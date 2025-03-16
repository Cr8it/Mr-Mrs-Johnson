"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, Upload, FileText, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"

interface CsvUploadModalProps {
	isOpen: boolean
	onClose: () => void
	onUpload: (guests: any[]) => void
}

export function CsvUploadModal({ isOpen, onClose, onUpload }: CsvUploadModalProps) {
	const [file, setFile] = useState<File | null>(null)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [dragActive, setDragActive] = useState(false)

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true)
		} else if (e.type === "dragleave") {
			setDragActive(false)
		}
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0]
			if (file.type === "text/csv") {
				setFile(file)
				setError("")
			} else {
				setError("Please upload a CSV file")
			}
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			setFile(e.target.files[0])
			setError("")
		}
	}

	const downloadSampleCsv = () => {
		const csvContent = "name,email,household\nJohn Doe,john@example.com,Doe Family\nJane Doe,jane@example.com,Doe Family"
		const blob = new Blob([csvContent], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'guest-list-template.csv'
		a.click()
		window.URL.revokeObjectURL(url)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!file) return

		setLoading(true)
		setError("")

		const formData = new FormData()
		formData.append('file', file)

		try {
			const response = await fetch('/api/admin/upload-guests', {
				method: 'POST',
				body: formData
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to upload guests')
			}

			onUpload(data.households)
			onClose()
		} catch (error: any) {
			setError(error.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] dark:bg-gray-800">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold flex items-center gap-2">
						<Upload className="h-5 w-5 text-gold" />
						Upload Guest List
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div
						className={`
							relative rounded-lg border-2 border-dashed p-6 transition-colors
							${dragActive ? 'border-gold bg-gold/5' : 'border-gray-200 dark:border-gray-700'}
							${file ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : ''}
						`}
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
					>
						<input
							type="file"
							accept=".csv"
							onChange={handleFileChange}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						/>
						<div className="text-center">
							{file ? (
								<div className="space-y-2">
									<CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
									<div>
										<p className="text-sm font-medium">{file.name}</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{(file.size / 1024).toFixed(2)} KB
										</p>
									</div>
								</div>
							) : (
								<>
									<FileText className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
									<div className="mt-2">
										<p className="text-sm font-medium dark:text-gray-200">
											Drag and drop your CSV file here, or click to browse
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											File must be in CSV format
										</p>
									</div>
								</>
							)}
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={downloadSampleCsv}
								className="text-xs"
							>
								<Download className="mr-2 h-3 w-3" />
								Download Template
							</Button>
						</div>
						
						<Alert>
							<AlertTitle className="flex items-center gap-2 text-sm font-medium">
								<AlertCircle className="h-4 w-4" />
								Required CSV Format
							</AlertTitle>
							<AlertDescription className="mt-2 text-xs space-y-2">
								<p>Your CSV file must include the following columns:</p>
								<ul className="list-disc list-inside">
									<li>name (Guest's full name)</li>
									<li>email (Guest's email address)</li>
									<li>household (Household/family name)</li>
								</ul>
							</AlertDescription>
						</Alert>
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription className="ml-2">{error}</AlertDescription>
						</Alert>
					)}

					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="flex-1 sm:flex-none"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!file || loading}
							className="flex-1 sm:flex-none bg-gold hover:bg-[#c19b2f] text-white"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="mr-2 h-4 w-4" />
									Upload Guest List
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}