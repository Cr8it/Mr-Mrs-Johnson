import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  if (path.startsWith('/admin')) {
    // Always allow access to login page
    if (path === '/admin/login') {
      return NextResponse.next()
    }

    // Check for authentication cookie
    const isAuthenticated = request.cookies.get('adminAuthenticated')?.value === 'true'
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

