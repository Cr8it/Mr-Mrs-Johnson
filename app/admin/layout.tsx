"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { CountdownTimer } from "@/components/CountdownTimer"
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  Menu as MenuIcon,
  Coffee,
  LogOut,
  ChevronDown,
  Bell,
  Moon,
  Sun,
  Settings,
  Image
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Guest List', href: '/admin/guests', icon: Users },
  { name: 'Questions', href: '/admin/questions', icon: HelpCircle },
  { name: 'Menu Options', href: '/admin/menu-options', icon: Coffee },
  { name: 'Bridal Party', href: '/admin/bridal-party', icon: Users },
  { name: 'Photo Gallery', href: '/admin/gallery', icon: Image },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [weddingDate, setWeddingDate] = useState<Date | null>(null)
  const [showCountdown, setShowCountdown] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  useEffect(() => {
    const isAuthenticated = document.cookie.includes('adminAuthenticated=true')
    if (!isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [pathname, router])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        console.log('Fetched settings:', data)
        if (data && data.weddingDate) {
          setWeddingDate(new Date(data.weddingDate))
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  if (pathname === "/admin/login") return children

  const handleLogout = () => {
    document.cookie = "adminAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/admin/login")
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform shadow-lg transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex h-16 items-center justify-between px-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Wedding Admin</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className={`lg:hidden ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
        <nav className="space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gold text-white'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive 
                    ? 'text-white' 
                    : theme === 'dark'
                    ? 'text-gray-400 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-gray-900'
                }`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className={`lg:pl-64 flex flex-col min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <header className={`sticky top-0 z-40 flex h-auto flex-col border-b shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </Button>

            <div className="flex-1 flex items-center justify-end gap-x-4 lg:gap-x-6">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </Button>

              <Button variant="ghost" size="icon" className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                <Bell className="h-6 w-6" />
              </Button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
                    <div className="h-8 w-8 rounded-full bg-gold text-white flex items-center justify-center font-medium">
                      A
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-48 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className={`flex items-center w-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className={`text-red-600 hover:text-red-700 ${theme === 'dark' ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
            {weddingDate && !isNaN(weddingDate.getTime()) && showCountdown && (
            <div className="relative">
              <div className="absolute right-4 top-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCountdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
              </div>
                <CountdownTimer weddingDate={weddingDate} variant="admin" />
            </div>
            )}

        </header>

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
