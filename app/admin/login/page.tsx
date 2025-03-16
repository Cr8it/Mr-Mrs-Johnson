"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Lock, User, Loader2 } from "lucide-react"

export default function AdminLoginPage() {
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const { toast } = useToast()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			if (username.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_USERNAME?.toLowerCase() && 
				password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
				document.cookie = "adminAuthenticated=true; path=/; max-age=86400; SameSite=Lax"
				
				// Add a small delay for animation
				await new Promise(resolve => setTimeout(resolve, 500))
				
				router.push("/admin")
				
				toast({
					title: "Welcome Back!",
					description: "Successfully logged in to admin dashboard",
				})
			} else {
				throw new Error("Invalid username or password")
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Authentication Failed",
				description: error instanceof Error ? error.message : "Failed to log in",
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
			<motion.div
				className="w-full max-w-md space-y-8"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="text-center">
					<motion.h1 
						className="text-3xl font-bold text-white"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						Wedding Admin
					</motion.h1>
					<motion.p 
						className="mt-2 text-gray-400"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						Sign in to manage your wedding details
					</motion.p>
				</div>

				<motion.div
					className="mt-8 p-8 bg-black/30 rounded-lg border border-white/10 shadow-xl"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.4 }}
				>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-gray-300">
								Username
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									type="text"
									placeholder="Enter your username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="pl-10 bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-gold/50 focus:ring-gold/50"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium text-gray-300">
								Password
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="pl-10 bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-gold/50 focus:ring-gold/50"
									required
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={loading}
							className="w-full bg-gold hover:bg-[#c19b2f] text-white transition-colors"
						>
							{loading ? (
								<div className="flex items-center justify-center">
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</div>
							) : (
								'Sign in'
							)}
						</Button>
					</form>
				</motion.div>
			</motion.div>
		</div>
	)
}

