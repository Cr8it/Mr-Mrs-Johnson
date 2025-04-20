"use client"

import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Edit2, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";


interface TeamMember {
	id: string;
	name: string;
	role: string;
	description: string;
	imageUrl: string;
	type: 'bridesmaid' | 'groomsman';
	order: number;
}

const MemberCard = ({ member, onEdit, onDelete, moveCard, index }: any) => {
	const [{ isDragging }, drag] = useDrag({
		type: member.type,
		item: { id: member.id, index, type: member.type },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [{ isOver }, drop] = useDrop({
		accept: member.type,
		hover: (item: any) => {
			if (item.index !== index) {
				moveCard(item.index, index, member.type);
				item.index = index;
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
		}),
	});

	const dragDropRef = (node: HTMLDivElement | null) => {
		drag(drop(node));
	};

	return (
		<div
			ref={dragDropRef}
			className={`relative p-6 bg-white rounded-xl border ${
				isOver 
					? 'border-gold/50 bg-white' 
					: 'border-gray-200 hover:border-gold/30'
			} transition-all duration-300 ${
				isDragging ? 'opacity-50' : ''
			} group shadow-sm`}
		>
			<div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-gradient-to-b from-gold via-gold/50 to-transparent rounded-full group-hover:h-32 group-hover:opacity-100 opacity-50 transition-all duration-300" />
			<div className="flex items-start gap-4">
				<div className="cursor-move text-gray-400 hover:text-gold/60 transition-colors">
					<GripVertical size={20} />
				</div>
				<div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gold">
					<Image
						src={member.imageUrl}
						alt={member.name}
						fill
						className="object-cover"
					/>
				</div>
				<div className="flex-1">
					<h3 className="text-xl font-cormorant font-semibold text-gray-900">{member.name}</h3>
					<p className="text-gold font-montserrat">{member.role}</p>
					<p className="text-sm text-gray-600 mt-2 font-montserrat">{member.description}</p>
				</div>
				<div className="flex flex-col gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={() => onEdit(member)}
								className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors"
							>
								<Edit2 size={16} />
							</button>
						</TooltipTrigger>
						<TooltipContent>Edit member</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={() => onDelete(member.id)}
								className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
							>
								<Trash2 size={16} />
							</button>
						</TooltipTrigger>
						<TooltipContent>Delete member</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
};

export default function BridalPartyAdmin() {
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		role: '',
		description: '',
		imageUrl: '',
		type: 'bridesmaid'
	});
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		fetchMembers();
	}, []);

	const fetchMembers = async () => {
		try {
			setIsLoading(true);
			const response = await fetch('/api/admin/bridal-party');
			const data = await response.json();
			if (Array.isArray(data)) {
				setMembers(data);
			}
		} catch (error) {
			console.error('Error fetching members:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			setIsUploading(true);
			setUploadError(null);
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/admin/upload-image', {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();
			if (data.success) {
				setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
				setPreviewImage(URL.createObjectURL(file));
			} else {
				setUploadError(data.error || 'Failed to upload image');
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			setUploadError('Failed to upload image. Please try again.');
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const url = '/api/admin/bridal-party';
		const method = editingMember ? 'PUT' : 'POST';
		const body = editingMember ? { ...formData, id: editingMember.id } : formData;

		try {
			await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			setEditingMember(null);
			setFormData({ name: '', role: '', description: '', imageUrl: '', type: 'bridesmaid' });
			setPreviewImage(null);
			fetchMembers();
			router.refresh();
		} catch (error) {
			console.error('Error saving member:', error);
		}
	};

	const handleEdit = (member: TeamMember) => {
		setEditingMember(member);
		setFormData({
			name: member.name,
			role: member.role,
			description: member.description,
			imageUrl: member.imageUrl,
			type: member.type
		});
		setPreviewImage(member.imageUrl);
	};

	const handleDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this member?')) {
			await fetch(`/api/admin/bridal-party?id=${id}`, { method: 'DELETE' });
			fetchMembers();
			router.refresh();
		}
	};

	const moveCard = async (dragIndex: number, hoverIndex: number, type: string) => {
		const updatedMembers = [...members];
		const typeMembers = updatedMembers.filter(m => m.type === type);
		
		// Get the dragged member
		const dragMember = typeMembers[dragIndex];
		
		// Calculate new order values
		const newOrder = typeMembers.map(m => m.id);
		newOrder.splice(dragIndex, 1);
		newOrder.splice(hoverIndex, 0, dragMember.id);
		
		// Update order numbers for all affected members
		const reorderedMembers = newOrder.map((id, index) => {
			const member = typeMembers.find(m => m.id === id)!;
			return {
				...member,
				order: index
			};
		});
		
		// Update local state immediately for smooth UI
		setMembers(prevMembers => {
			const newMembers = [...prevMembers];
			// First, get all members that are not of the current type
			const otherMembers = newMembers.filter(m => m.type !== type);
			// Then combine with reordered members
			return [...otherMembers, ...reorderedMembers].sort((a, b) => {
				if (a.type !== b.type) return a.type.localeCompare(b.type);
				return a.order - b.order;
			});
		});
		
		// Persist changes to the server
		try {
			const response = await fetch('/api/admin/bridal-party/reorder', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ members: reorderedMembers }),
			});
			
			if (!response.ok) {
				throw new Error('Failed to save order');
			}
		} catch (error) {
			console.error('Error saving order:', error);
			// Revert the state if save fails
			fetchMembers();
		}
	};

	const bridesmaids = members
		.filter(m => m.type === 'bridesmaid')
		.sort((a, b) => a.order - b.order);

	const groomsmen = members
		.filter(m => m.type === 'groomsman')
		.sort((a, b) => a.order - b.order);

	return (
		<TooltipProvider delayDuration={0}>
			<DndProvider backend={HTML5Backend}>
			<div className="max-w-5xl mx-auto p-6">
				<div className="mb-8">
					<h1 className="text-4xl font-cormorant font-bold text-gray-900 mb-2">Manage Bridal Party</h1>
					<p className="text-sm text-gray-600 font-montserrat">Add, edit, and reorder your bridal party members</p>
				</div>
				
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<h2 className="text-2xl font-cormorant font-semibold mb-6 text-gray-900">
							{editingMember ? 'Edit Member' : 'Add New Member'}
						</h2>
						
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="flex justify-center mb-6">
								<div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-gold/50 hover:border-gold transition-colors">
									{(previewImage || formData.imageUrl) ? (
										<>
											<Image
												src={previewImage || formData.imageUrl}
												alt="Preview"
												fill
												className="object-cover"
											/>
											<button
												type="button"
												onClick={() => {
													setPreviewImage(null);
													setFormData(prev => ({ ...prev, imageUrl: '' }));
												}}
												className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-600/80"
											>
												<X size={14} />
											</button>
										</>
									) : (
										<label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 bg-white/10">
											<ImageIcon size={24} className="text-gold/60" />
											<span className="text-xs text-gold/60 mt-2">Upload Image</span>
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
											<Upload className="animate-bounce text-gold" />
										</div>
									)}
								</div>
							</div>
							{uploadError && (
								<p className="text-red-500 text-sm mt-2">{uploadError}</p>
							)}

							<div>
								<label className="block text-sm font-medium mb-2 text-gray-700">Name</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full p-2 rounded bg-white border border-gray-300 hover:border-gold/30 transition-colors focus:border-gold focus:outline-none text-gray-900 placeholder-gray-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2 text-gray-700">Role</label>
								<select
									value={formData.role}
									onChange={(e) => setFormData({ ...formData, role: e.target.value })}
									className="w-full p-2 rounded bg-white border border-gray-300 hover:border-gold/30 transition-colors focus:border-gold focus:outline-none text-gray-900 [&>option]:bg-white [&>option]:text-gray-900"
									required
								>
									<option value="">Select Role</option>
									<option value="Maid of Honour">VIP (Very Important Petal-Princess)</option>
									<option value="Maid of Honour">C.E.O. – Chief Eye-Roller Officer</option>
									<option value="Maid of Honour">Maid of Honor</option>
									<option value="Matron of Honor">Matron of Honor</option>
									<option value="Bridesmaid">Bridesmaid</option>									
									<option value="Best Man">Best Man</option>
									<option value="Groomsman">Groomsman</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
								<textarea
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									className="w-full p-2 rounded bg-white border border-gray-300 hover:border-gold/30 transition-colors focus:border-gold focus:outline-none text-gray-900 placeholder-gray-500"
									rows={4}
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
								<select
									value={formData.type}
									onChange={(e) => setFormData({ ...formData, type: e.target.value as 'bridesmaid' | 'groomsman' })}
									className="w-full p-2 rounded bg-white border border-gray-300 hover:border-gold/30 transition-colors focus:border-gold focus:outline-none text-gray-900 [&>option]:bg-white [&>option]:text-gray-900"
									required
								>
									<option value="bridesmaid">Bridesmaid</option>
									<option value="groomsman">Groomsman</option>
								</select>
							</div>

							<button
								type="submit"
								className="w-full px-4 py-2 bg-gold hover:bg-gold/90 text-white rounded-lg font-medium transition-colors"
								disabled={isUploading}
							>
								{editingMember ? 'Update Member' : 'Add Member'}
							</button>
						</form>
					</div>

					<div className="space-y-8">
						<div>
							<h2 className="text-2xl font-cormorant font-semibold mb-2 text-gray-900">Bridesmaids</h2>
							<p className="text-sm text-gray-600 mb-4 font-montserrat">Drag to reorder bridesmaids</p>
							<div className="space-y-4">
								{isLoading ? (
									<div className="space-y-4">
										{[1, 2, 3].map((i) => (
											<div key={i} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
												<div className="flex items-start gap-4">
													<div className="cursor-move text-gray-400">
														<GripVertical size={20} />
													</div>
													<div className="relative w-24 h-24 rounded-full overflow-hidden">
														<Skeleton className="absolute inset-0" />
													</div>
													<div className="flex-1">
														<Skeleton className="h-6 w-32 mb-2" />
														<Skeleton className="h-4 w-24 mb-2" />
														<Skeleton className="h-4 w-full" />
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									bridesmaids.map((member, index) => (
										<MemberCard
											key={member.id}
											member={member}
											index={index}
											onEdit={handleEdit}
											onDelete={handleDelete}
											moveCard={moveCard}
										/>
									))
								)}
							</div>
						</div>

						<div>
							<h2 className="text-2xl font-cormorant font-semibold mb-2 text-gray-900">Groomsmen</h2>
							<p className="text-sm text-gray-600 mb-4 font-montserrat">Drag to reorder groomsmen</p>
							<div className="space-y-4">
								{isLoading ? (
									<div className="space-y-4">
										{[1, 2, 3].map((i) => (
											<div key={i} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
												<div className="flex items-start gap-4">
													<div className="cursor-move text-gray-400">
														<GripVertical size={20} />
													</div>
													<div className="relative w-24 h-24 rounded-full overflow-hidden">
														<Skeleton className="absolute inset-0" />
													</div>
													<div className="flex-1">
														<Skeleton className="h-6 w-32 mb-2" />
														<Skeleton className="h-4 w-24 mb-2" />
														<Skeleton className="h-4 w-full" />
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									groomsmen.map((member, index) => (
										<MemberCard
											key={member.id}
											member={member}
											index={index}
											onEdit={handleEdit}
											onDelete={handleDelete}
											moveCard={moveCard}
										/>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</DndProvider>
	</TooltipProvider>
	);

}