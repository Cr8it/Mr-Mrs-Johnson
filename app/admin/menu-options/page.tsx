"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Plus, X, GripVertical, Trash } from "lucide-react"
import { PreferenceStats } from "@/components/PreferenceStats"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface Option {
	id: string
	name: string
	isActive: boolean
	isChildOption?: boolean
	order: number
}

interface DeleteConfirmation {
	isOpen: boolean
	optionId: string
	optionType: 'meal' | 'dessert'
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all group">
				<div className="flex items-center gap-2 flex-1">
					<button {...listeners} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
						<GripVertical className="h-4 w-4" />
					</button>
					{children}
				</div>
			</div>
		</div>
	)
}

export default function MenuOptionsPage() {
	const [mealOptions, setMealOptions] = useState<Option[]>([])
	const [dessertOptions, setDessertOptions] = useState<Option[]>([])
	const [newMealOption, setNewMealOption] = useState("")
	const [isChildMealOption, setIsChildMealOption] = useState(false)
	const [newDessertOption, setNewDessertOption] = useState("")
	const [isChildDessertOption, setIsChildDessertOption] = useState(false)
	const { toast } = useToast()
	const [statistics, setStatistics] = useState<{
		mealChoices: { name: string; count: number }[];
		dessertChoices: { name: string; count: number }[];
		totalGuests: number;
	}>({
		mealChoices: [],
		dessertChoices: [],
		totalGuests: 0
	})
	const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
		isOpen: false,
		optionId: '',
		optionType: 'meal'
	})

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	useEffect(() => {
		fetchOptions()
		fetchStatistics()
	}, [])

	const fetchStatistics = async () => {
		try {
			const response = await fetch('/api/admin/statistics')
			if (response.ok) {
				const data = await response.json()
				setStatistics({
					mealChoices: data.mealChoices,
					dessertChoices: data.dessertChoices,
					totalGuests: data.attendingGuests
				})
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to fetch statistics"
			})
		}
	}

	const fetchOptions = async () => {
		try {
			const [mealResponse, dessertResponse] = await Promise.all([
				fetch('/api/admin/meal-options'),
				fetch('/api/admin/dessert-options')
			])

			if (mealResponse.ok) {
				const mealData = await mealResponse.json()
				setMealOptions(mealData.options)
			}

			if (dessertResponse.ok) {
				const dessertData = await dessertResponse.json()
				setDessertOptions(dessertData.options)
			}

			// Refresh statistics after fetching options
			await fetchStatistics()
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to fetch options"
			})
		}
	}

	const handleDragEnd = async (event: any, type: 'meal' | 'dessert') => {
		if (!event.active || !event.over) return

		const oldIndex = type === 'meal'
			? mealOptions.findIndex(item => item.id === event.active.id)
			: dessertOptions.findIndex(item => item.id === event.active.id)
		const newIndex = type === 'meal'
			? mealOptions.findIndex(item => item.id === event.over.id)
			: dessertOptions.findIndex(item => item.id === event.over.id)

		if (oldIndex === -1 || newIndex === -1) return

		try {
			const options = type === 'meal' ? mealOptions : dessertOptions
			const reorderedOptions = arrayMove(options, oldIndex, newIndex)

			if (type === 'meal') {
				setMealOptions(reorderedOptions)
			} else {
				setDessertOptions(reorderedOptions)
			}

			const response = await fetch(`/api/admin/${type}-options/reorder`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ options: reorderedOptions })
			})

			if (!response.ok) throw new Error(`Failed to reorder ${type} options`)

			// Refresh statistics after reordering
			await fetchStatistics()
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: `Failed to reorder ${type} options`
			})
		}
	}

	const handleAddMealOption = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!newMealOption.trim()) {
			toast({
				title: "Error",
				description: "Please enter a meal option name.",
				variant: "destructive",
			})
			return
		}
		
		setIsMealAdding(true)
		
		try {
			// Extract isChildOption from the form
			const form = e.target as HTMLFormElement;
			const isChildOptionCheckbox = form.querySelector('#meal-for-children') as HTMLInputElement;
			const isChildOption = isChildOptionCheckbox ? isChildOptionCheckbox.checked : false;
			
			const response = await fetch('/api/admin/meal-options', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newMealOption.trim(),
					isChildOption: isChildOption
				}),
			})
			
			const data = await response.json()
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to add meal option')
			}
			
			fetchOptions()
			fetchStatistics()
			setNewMealOption('')
			
			toast({
				title: "Success",
				description: `Added ${isChildOption ? "children's" : ""} meal option: ${newMealOption}`,
			})
		} catch (error) {
			console.error('Error adding meal option:', error)
			toast({
				title: "Error",
				description: "Failed to add meal option.",
				variant: "destructive",
			})
		} finally {
			setIsMealAdding(false)
		}
	}

	const handleAddDessertOption = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!newDessertOption.trim()) {
			toast({
				title: "Error",
				description: "Please enter a dessert option name.",
				variant: "destructive",
			})
			return
		}
		
		setIsDessertAdding(true)
		
		try {
			// Extract isChildOption from the form
			const form = e.target as HTMLFormElement;
			const isChildOptionCheckbox = form.querySelector('#dessert-for-children') as HTMLInputElement;
			const isChildOption = isChildOptionCheckbox ? isChildOptionCheckbox.checked : false;
			
			const response = await fetch('/api/admin/dessert-options', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newDessertOption.trim(),
					isChildOption: isChildOption
				}),
			})
			
			const data = await response.json()
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to add dessert option')
			}
			
			fetchOptions()
			fetchStatistics()
			setNewDessertOption('')
			
			toast({
				title: "Success",
				description: `Added ${isChildOption ? "children's" : ""} dessert option: ${newDessertOption}`,
			})
		} catch (error) {
			console.error('Error adding dessert option:', error)
			toast({
				title: "Error",
				description: "Failed to add dessert option.",
				variant: "destructive",
			})
		} finally {
			setIsDessertAdding(false)
		}
	}

	const handleRemoveOption = async (id: string, type: 'meal' | 'dessert') => {
		try {
			const response = await fetch(`/api/admin/${type}-options/${id}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				await fetchOptions()
				toast({
					title: "Success",
					description: `${type.charAt(0).toUpperCase() + type.slice(1)} option removed successfully`
				})
				// Refresh statistics after removing option
				await fetchStatistics()
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: `Failed to remove ${type} option`
			})
		}
	}

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white p-6 rounded-lg shadow-sm">
					<PreferenceStats
						title="Meal"
						options={statistics.mealChoices}
						totalGuests={statistics.totalGuests}
						colorClass="bg-gold"
					/>
				</div>
				<div className="bg-white p-6 rounded-lg shadow-sm">
					<PreferenceStats
						title="Dessert"
						options={statistics.dessertChoices}
						totalGuests={statistics.totalGuests}
						colorClass="bg-rose-400"
					/>
				</div>
			</div>

			<AlertDialog 
				open={deleteConfirmation.isOpen} 
				onOpenChange={(isOpen) => setDeleteConfirmation(prev => ({ ...prev, isOpen }))}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently remove this option.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => {
							handleRemoveOption(deleteConfirmation.optionId, deleteConfirmation.optionType)
							setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))
						}}>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			
			<div className="space-y-6">
				<div className="bg-white p-6 rounded-lg shadow-sm">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Meal Options</h2>
					<form onSubmit={handleAddMealOption} className="space-y-4 mb-6">
						<div className="flex gap-2">
							<Input
								value={newMealOption}
								onChange={(e) => setNewMealOption(e.target.value)}
								placeholder="Add new meal option..."
								className="max-w-xs bg-gray-50 border-gray-200 focus:border-gold focus:ring-gold"
							/>
							<Button type="submit" className="bg-gold hover:bg-[#c19b2f] text-white">
								<Plus className="h-4 w-4 mr-2" />
								Add Option
							</Button>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox 
								id="meal-for-children"
								checked={isChildMealOption}
								onCheckedChange={(checked) => setIsChildMealOption(checked === true)}
							/>
							<label
								htmlFor="meal-for-children"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								This is a children's meal option
							</label>
						</div>
					</form>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={(event) => handleDragEnd(event, 'meal')}
					>
						<SortableContext
							items={mealOptions.map(option => option.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-2">
								{mealOptions.map((option, index) => (
									<SortableItem key={option.id} id={option.id}>
										<div 
											className="flex items-center justify-between bg-card p-3 rounded-md border mb-2 cursor-grab"
										>
											<div className="flex-1 mr-4 flex items-center">
											<span className="mr-1">{option.name}</span>
											{option.isChildOption && (
												<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-2 dark:bg-blue-900 dark:text-blue-300">
												Child
												</span>
											)}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setDeleteConfirmation({ isOpen: true, optionId: option.id, optionType: 'meal' })}
												className="text-destructive"
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									</SortableItem>
								))}
							</div>
						</SortableContext>
					</DndContext>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm mt-10">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Dessert Options</h2>
					<form onSubmit={handleAddDessertOption} className="space-y-4 mb-6">
						<div className="flex gap-2">
							<Input
								value={newDessertOption}
								onChange={(e) => setNewDessertOption(e.target.value)}
								placeholder="Add new dessert option..."
								className="max-w-xs bg-gray-50 border-gray-200 focus:border-gold focus:ring-gold"
							/>
							<Button type="submit" className="bg-gold hover:bg-[#c19b2f] text-white">
								<Plus className="h-4 w-4 mr-2" />
								Add Option
							</Button>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox 
								id="dessert-for-children"
								checked={isChildDessertOption}
								onCheckedChange={(checked) => setIsChildDessertOption(checked === true)}
							/>
							<label
								htmlFor="dessert-for-children"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								This is a children's dessert option
							</label>
						</div>
					</form>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={(event) => handleDragEnd(event, 'dessert')}
					>
						<SortableContext
							items={dessertOptions.map(option => option.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-2">
								{dessertOptions.map((option, index) => (
									<SortableItem key={option.id} id={option.id}>
										<div 
											className="flex items-center justify-between bg-card p-3 rounded-md border mb-2 cursor-grab"
										>
											<div className="flex-1 mr-4 flex items-center">
											<span className="mr-1">{option.name}</span>
											{option.isChildOption && (
												<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-2 dark:bg-blue-900 dark:text-blue-300">
												Child
												</span>
											)}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setDeleteConfirmation({ isOpen: true, optionId: option.id, optionType: 'dessert' })}
												className="text-destructive"
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									</SortableItem>
								))}
							</div>
						</SortableContext>
					</DndContext>
				</div>
			</div>
		</div>
	)
}