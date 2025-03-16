import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Clear the authentication cookie
  response.cookies.set("adminAuthenticated", "", {
    path: "/admin",
    expires: new Date(0),
  })
  
  return response
}
