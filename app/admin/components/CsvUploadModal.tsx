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
	const [errorList, setErrorList] = useState<string[]>([])
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
				setErrorList([])
			} else {
				setError("Please upload a CSV file")
				setErrorList([])
			}
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			setFile(e.target.files[0])
			setError("")
			setErrorList([])
		}
	}

	const downloadSampleCsv = () => {
		const csvContent = "Name,Email,Household,Child,Teenager\nJohn Smith,john@example.com,Smith Family,yes,\nJane Smith,jane@example.com,Smith Family,,yes\nBaby Smith,,Smith Family,yes,"
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
		setErrorList([])

		const formData = new FormData()
		formData.append('file', file)

		try {
			const response = await fetch('/api/admin/upload-guests', {
				method: 'POST',
				body: formData
			})

			const data = await response.json()

			if (!response.ok) {
				// Check for different error message formats
				if (data.message) {
					setError(data.message)
				} else {
					setError(data.error || 'Failed to upload guests')
				}
				
				// Display error list if available
				if (data.errorList) {
					setErrorList(data.errorList.split('\n'))
				} else if (data.details && Array.isArray(data.details)) {
					// Format detailed errors into an array for display
					setErrorList(data.details.map((detail: any) => 
						`Row ${detail.row} (${detail.name}): ${detail.errors.join(', ')}`
					))
				}
				
				return
			}

			onUpload(data.households || [])
			onClose()
		} catch (error: any) {
			setError(error.message || 'An unexpected error occurred')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold flex items-center gap-2">
						<Upload className="h-5 w-5 text-gold" />
						Upload Guest List
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
						className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${
							dragActive ? "border-gold bg-gold/5" : "border-gray-300 dark:border-gray-600"
						}`}
					>
						{file ? (
							<div className="flex flex-col items-center gap-2">
								<FileText className="h-10 w-10 text-gold" />
								<div className="text-sm font-medium">{file.name}</div>
								<div className="text-xs text-gray-500">
									{(file.size / 1024).toFixed(2)} KB
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setFile(null)
										setError("")
										setErrorList([])
									}}
									className="mt-2 text-xs"
								>
									Remove
								</Button>
							</div>
						) : (
							<div className="flex flex-col items-center">
								<Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
								<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
									Drag & drop your CSV file here, or click to select
								</p>
								<Input
									type="file"
									accept=".csv"
									className="hidden"
									id="csv-upload"
									onChange={handleFileChange}
								/>
								<label htmlFor="csv-upload">
									<Button type="button" variant="outline" size="sm" className="cursor-pointer">
										Select CSV File
									</Button>
								</label>
							</div>
						)}
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
									<li>Name (Guest's full name - required)</li>
									<li>Household (Household/family name - required)</li>
									<li>Email (Guest's email address - optional)</li>
									<li>Child (Use "yes" to mark as a child - optional)</li>
									<li>Teenager (Use "yes" to mark as a teenager - optional)</li>
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
					
					{errorList.length > 0 && (
						<Alert variant="destructive" className="mt-2">
							<AlertTitle className="flex items-center gap-2 text-sm font-medium">
								<AlertCircle className="h-4 w-4" />
								Validation Errors
							</AlertTitle>
							<AlertDescription className="mt-2 max-h-60 overflow-y-auto">
								<ul className="text-xs space-y-1 list-disc list-inside">
									{errorList.map((err, index) => (
										<li key={index}>{err}</li>
									))}
								</ul>
							</AlertDescription>
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