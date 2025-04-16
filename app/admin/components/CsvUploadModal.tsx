"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, Upload, FileText, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "react-hot-toast"

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
	const [uploadProgress, setUploadProgress] = useState(0)
	const [uploadStatus, setUploadStatus] = useState("")

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
		if (!file) {
			return
		}
		
		setError("")
		setErrorList([])
		setLoading(true)
		setUploadProgress(0)
		
		// Create abort controller for timeout handling
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
		
		try {
			if (file.size > 1024 * 1024) { // 1MB
				setError("Warning: This file is larger than 1MB and may take longer to upload. Consider splitting into smaller files if you encounter timeouts.")
			}
			
			// Read the file
			const fileData = await readFileAsText(file)
			let parsedData = fileData
				.split('\n')
				.filter(line => line.trim())
				.map(line => line.split(',').map(cell => cell.trim()))
			
			// Get headers from first row
			const headers = parsedData[0]
			
			// Process data rows, excluding header row
			const dataRows = parsedData.slice(1)
			
			// Split into batches of 10 rows
			const BATCH_SIZE = 10
			const batches = []
			
			for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
				batches.push(dataRows.slice(i, i + BATCH_SIZE))
			}
			
			setUploadProgress(10)
			simulateProgress()
			
			// Process batches sequentially
			const results = {
				totalProcessed: 0,
				totalHouseholds: 0,
				errors: [] as string[],
				processingTime: ""
			}
			
			for (let i = 0; i < batches.length; i++) {
				setUploadProgress(Math.floor(20 + (60 * (i / batches.length))))
				
				// Convert batch to CSV rows with headers
				const batchData = batches[i].map(row => {
					const record: Record<string, string> = {}
					headers.forEach((header, i) => {
						record[header] = row[i] || ''
					})
					return record
				})
				
				// Upload this batch
				const formData = new FormData()
				const batchBlob = new Blob([JSON.stringify({ records: batchData })], { 
					type: 'application/json' 
				})
				formData.append('data', batchBlob)
				
				try {
					const res = await fetch('/api/admin/upload-batch', {
						method: 'POST',
						body: formData,
						signal: controller.signal
					})
					
					if (!res.ok) {
						if (res.status === 504) {
							throw new Error("Server timeout. Try uploading smaller batches or check for formatting issues in your CSV. You can also try splitting your file into multiple smaller files.")
						} else {
							const errorData = await res.json()
							throw new Error(errorData.message || errorData.error || "Failed to upload file")
						}
					}
					
					const batchResult = await res.json()
					
					// Accumulate results using the new response format
					results.totalProcessed += batchResult.processed?.guests || 0
					results.totalHouseholds += batchResult.processed?.households || 0
					
					if (batchResult.errors && batchResult.errors.length > 0) {
						results.errors.push(...batchResult.errors)
					}
					
					// Track processing time of the last batch
					if (batchResult.processingTime) {
						results.processingTime = batchResult.processingTime
					}
				} catch (batchError) {
					if (batchError.name === 'AbortError') {
						throw new Error("Request timed out. Your file may be too large or complex. Try splitting it into smaller batches.")
					}
					throw batchError
				}
			}
			
			setUploadProgress(95)
			
			// All batches processed successfully
			clearTimeout(timeoutId);
			
			if (results.errors.length > 0) {
				setErrorList(results.errors)
				setError(`Import partially completed with ${results.errors.length} errors.`)
			} else {
				toast.success(`Imported ${results.totalProcessed} guests in ${results.totalHouseholds} households. Processing time: ${results.processingTime}`)
				onUpload([])
				onClose()
			}
		} catch (error: any) {
			console.error("Upload error:", error)
			clearTimeout(timeoutId);
			setError(error.message || "Failed to upload file: Unknown error")
		} finally {
			setLoading(false)
			setUploadProgress(100)
		}
	}

	// Helper function to read file as text
	const readFileAsText = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = reject
			reader.readAsText(file)
		})
	}

	// Simulate progress for better user experience
	const simulateProgress = () => {
		let progress = 0
		const interval = setInterval(() => {
			if (progress < 90) {
				// Simulate slower progress past certain thresholds
				let increment = 10
				if (progress > 30) increment = 5
				if (progress > 60) increment = 2
				if (progress > 75) increment = 1
				
				progress += increment
				setUploadProgress(progress)
				
				// Update status message based on progress
				if (progress < 30) {
					setUploadStatus("Uploading file...")
				} else if (progress < 60) {
					setUploadStatus("Creating new households...")
				} else if (progress < 85) {
					setUploadStatus("Adding guests to households...")
				} else {
					setUploadStatus("Finalizing import...")
				}
			} else {
				clearInterval(interval)
			}
		}, 1000)
		
		// Store interval ID so we can clear it if upload completes or errors
		// @ts-ignore - we're just storing the interval ID
		simulateProgress.intervalId = interval
		
		return () => {
			clearInterval(interval)
		}
	}

	// Clear progress simulation on unmount or completion
	useEffect(() => {
		return () => {
			// @ts-ignore - just cleaning up the interval
			if (simulateProgress.intervalId) {
				// @ts-ignore
				clearInterval(simulateProgress.intervalId)
			}
		}
	}, [])

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold flex items-center gap-2">
						<Upload className="h-5 w-5 text-gold" />
						Upload Guest List
					</DialogTitle>
					<DialogDescription>
						Upload a CSV file of guests. The file should have a header row with Name, Household, and optional fields like Email, Child, Teenager, and DietaryNotes.
					</DialogDescription>
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
								<p className="mt-2 font-medium text-gray-700 dark:text-gray-300">
									<strong>Note:</strong> New households will be created automatically when they don't exist.
								</p>
								<p className="mt-1 text-gray-600 dark:text-gray-400">
									Duplicate guests (same name in the same household) will be skipped, not updated or duplicated.
								</p>
							</AlertDescription>
						</Alert>
					</div>

					{loading && (
						<div className="mt-4 space-y-2">
							<div className="w-full bg-gray-200 rounded-full h-2.5">
								<div 
									className="bg-gold h-2.5 rounded-full transition-all duration-500" 
									style={{ width: `${uploadProgress}%` }}
								></div>
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-400 text-center">
								{uploadStatus} ({uploadProgress}%)
							</p>
						</div>
					)}

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
							disabled={loading}
							className="flex-1 sm:flex-none"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							onClick={handleSubmit}
							disabled={!file || loading}
							className="flex-1 sm:flex-none bg-gold hover:bg-[#c19b2f] text-white"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Processing...
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