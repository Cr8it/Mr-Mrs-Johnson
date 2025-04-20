import { NextResponse } from "next/server"

// Simple test endpoint to verify API routes are working correctly
export async function GET() {
  return NextResponse.json({ 
    message: "API routes are working!", 
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  let body = null
  try {
    body = await request.json()
  } catch (e) {
    // If body parsing fails, that's okay
  }
  
  return NextResponse.json({
    message: "POST request received",
    receivedBody: body,
    timestamp: new Date().toISOString()
  })
} 