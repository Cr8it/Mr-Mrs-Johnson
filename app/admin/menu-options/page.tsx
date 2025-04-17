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
import {
	DragDropContext,
	Droppable,
	Draggable,
} from "@hello-pangea/dnd"
import { Label } from "@/components/ui/label"

interface Option {
	id: string
	name: string
	isActive: boolean
	isChildOption?: boolean
	order: number
	guestCount?: number
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

function MealOptionsList({ options, onReorder, onRemove }: { options: Option[]; onReorder: (event: any) => void; onRemove: (id: string) => void }) {
	return (
		<DragDropContext onDragEnd={onReorder}>
			<Droppable droppableId="meal-options">
				{(provided) => (
					<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
						{options.map((option, index) => (
							<Draggable key={option.id} draggableId={option.id} index={index}>
								{(provided) => (
									<div
										ref={provided.innerRef}
										{...provided.draggableProps}
										{...provided.dragHandleProps}
										className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
									>
										<div className="flex items-center gap-4">
											<GripVertical className="h-5 w-5 text-gray-400" />
											<div>
												<div className="font-medium">{option.name}</div>
												{option.isChildOption && (
													<span className="text-xs text-gray-500">Children's Option</span>
												)}
											</div>
										</div>
										<div className="flex items-center space-x-4">
											{(option.guestCount ?? 0) > 0 && (
												<span className="text-sm text-gray-500">
													{option.guestCount} {(option.guestCount ?? 0) === 1 ? 'guest' : 'guests'}
												</span>
											)}
											<button
												onClick={() => onRemove(option.id)}
												className="text-red-500 hover:text-red-700 transition-colors"
											>
												<Trash className="h-4 w-4" />
											</button>
										</div>
									</div>
								)}
							</Draggable>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	)
}

function DessertOptionsList({ options, onReorder, onRemove }: { options: Option[]; onReorder: (event: any) => void; onRemove: (id: string) => void }) {
	return (
		<DragDropContext onDragEnd={onReorder}>
			<Droppable droppableId="dessert-options">
				{(provided) => (
					<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
						{options.map((option, index) => (
							<Draggable key={option.id} draggableId={option.id} index={index}>
								{(provided) => (
									<div
										ref={provided.innerRef}
										{...provided.draggableProps}
										{...provided.dragHandleProps}
										className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
									>
										<div className="flex items-center gap-4">
											<GripVertical className="h-5 w-5 text-gray-400" />
											<div>
												<div className="font-medium">{option.name}</div>
												{option.isChildOption && (
													<span className="text-xs text-gray-500">Children's Option</span>
												)}
											</div>
										</div>
										<div className="flex items-center space-x-4">
											{(option.guestCount ?? 0) > 0 && (
												<span className="text-sm text-gray-500">
													{option.guestCount} {(option.guestCount ?? 0) === 1 ? 'guest' : 'guests'}
												</span>
											)}
											<button
												onClick={() => onRemove(option.id)}
												className="text-red-500 hover:text-red-700 transition-colors"
											>
												<Trash className="h-4 w-4" />
											</button>
										</div>
									</div>
								)}
							</Draggable>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	)
}

export default function MenuOptionsPage() {
	const [mealOptions, setMealOptions] = useState<Option[]>([])
	const [dessertOptions, setDessertOptions] = useState<Option[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({ isOpen: false, optionId: '', optionType: 'meal' })
	const [newMealOption, setNewMealOption] = useState({ name: '', isChildOption: false })
	const [newDessertOption, setNewDessertOption] = useState({ name: '', isChildOption: false })
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
			setLoading(true)
			const response = await fetch('/api/admin/menu-options')
			if (!response.ok) throw new Error('Failed to fetch options')
			const data = await response.json()
			
			// Sort options by their order
			const sortedMealOptions = data.mealOptions.sort((a: Option, b: Option) => a.order - b.order)
			const sortedDessertOptions = data.dessertOptions.sort((a: Option, b: Option) => a.order - b.order)
			
			setMealOptions(sortedMealOptions)
			setDessertOptions(sortedDessertOptions)
			setError(null)
		} catch (err) {
			setError('Failed to load menu options')
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load menu options"
			})
		} finally {
			setLoading(false)
		}
	}

	const handleDragEnd = async (result: any, type: 'meal' | 'dessert') => {
		if (!result.destination) return

		const items = type === 'meal' ? [...mealOptions] : [...dessertOptions]
		const [reorderedItem] = items.splice(result.source.index, 1)
		items.splice(result.destination.index, 0, reorderedItem)

		// Update the order property for each item
		const updatedItems = items.map((item, index) => ({
			...item,
			order: index
		}))

		if (type === 'meal') {
			setMealOptions(updatedItems)
		} else {
			setDessertOptions(updatedItems)
		}

		try {
			const response = await fetch('/api/admin/menu-options/reorder', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type,
					items: updatedItems.map(item => ({
						id: item.id,
						order: item.order
					}))
				})
			})

			if (!response.ok) throw new Error('Failed to update order')
			toast({
				description: "Order updated successfully",
				variant: "default"
			})
		} catch (err) {
			toast({
				description: "Failed to update order",
				variant: "destructive"
			})
			// Revert the changes
			fetchOptions()
		}
	}

	const handleAddMealOption = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newMealOption.name.trim()) return

		try {
			const response = await fetch('/api/admin/menu-options', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'meal',
					name: newMealOption.name,
					isChildOption: newMealOption.isChildOption,
					order: mealOptions.length
				})
			})

			if (!response.ok) throw new Error('Failed to add meal option')
			
			toast({
				description: "Meal option added successfully",
				variant: "default"
			})
			setNewMealOption({ name: '', isChildOption: false })
			fetchOptions()
		} catch (err) {
			toast({
				description: "Failed to add meal option",
				variant: "destructive"
			})
		}
	}

	const handleAddDessertOption = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newDessertOption.name.trim()) return

		try {
			const response = await fetch('/api/admin/menu-options', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'dessert',
					name: newDessertOption.name,
					isChildOption: newDessertOption.isChildOption,
					order: dessertOptions.length
				})
			})

			if (!response.ok) throw new Error('Failed to add dessert option')
			
			toast({
				description: "Dessert option added successfully",
				variant: "default"
			})
			setNewDessertOption({ name: '', isChildOption: false })
			fetchOptions()
		} catch (err) {
			toast({
				description: "Failed to add dessert option",
				variant: "destructive"
			})
		}
	}

	const handleRemoveOption = async (optionId: string, type: 'meal' | 'dessert') => {
		try {
			const response = await fetch(`/api/admin/menu-options/${optionId}`, {
				method: 'DELETE'
			})

			if (!response.ok) throw new Error('Failed to remove option')
			
			toast({
				description: `${type === 'meal' ? 'Meal' : 'Dessert'} option removed successfully`,
				variant: "default"
			})
			fetchOptions()
		} catch (err) {
			toast({
				description: "Failed to remove option",
				variant: "destructive"
			})
		}
		setDeleteConfirmation({ isOpen: false, optionId: '', optionType: 'meal' })
	}

	if (loading) return <div>Loading...</div>
	if (error) return <div>Error: {error}</div>

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">Menu Options</h1>
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<h2 className="text-xl font-semibold mb-4">Meal Options</h2>
					<form onSubmit={handleAddMealOption} className="mb-4">
						<div className="flex gap-4 mb-4">
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Add new meal option"
									value={newMealOption.name}
									onChange={(e) => setNewMealOption(prev => ({ ...prev, name: e.target.value }))}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="meal-child-option"
									checked={newMealOption.isChildOption}
									onCheckedChange={(checked) => 
										setNewMealOption(prev => ({ ...prev, isChildOption: checked === true }))
									}
								/>
								<Label htmlFor="meal-child-option">Child Option</Label>
							</div>
							<Button type="submit" disabled={!newMealOption.name.trim()}>
								Add
							</Button>
						</div>
					</form>
					
					<MealOptionsList
						options={mealOptions}
						onReorder={(result) => handleDragEnd(result, 'meal')}
						onRemove={(id) => handleRemoveOption(id, 'meal')}
					/>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-4">Dessert Options</h2>
					<form onSubmit={handleAddDessertOption} className="mb-4">
						<div className="flex gap-4 mb-4">
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Add new dessert option"
									value={newDessertOption.name}
									onChange={(e) => setNewDessertOption(prev => ({ ...prev, name: e.target.value }))}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="dessert-child-option"
									checked={newDessertOption.isChildOption}
									onCheckedChange={(checked) => 
										setNewDessertOption(prev => ({ ...prev, isChildOption: checked === true }))
									}
								/>
								<Label htmlFor="dessert-child-option">Child Option</Label>
							</div>
							<Button type="submit" disabled={!newDessertOption.name.trim()}>
								Add
							</Button>
						</div>
					</form>
					
					<DessertOptionsList
						options={dessertOptions}
						onReorder={(result) => handleDragEnd(result, 'dessert')}
						onRemove={(id) => handleRemoveOption(id, 'dessert')}
					/>
				</div>
			</div>

			<AlertDialog open={deleteConfirmation.isOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete this menu option. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteConfirmation({ isOpen: false, optionId: '', optionType: 'meal' })}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleRemoveOption(deleteConfirmation.optionId, deleteConfirmation.optionType)}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}