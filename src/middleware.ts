import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Example middleware logic
  // You can add authentication checks or redirects here
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
}


