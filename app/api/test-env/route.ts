import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    adminPassword: process.env.ADMIN_PASSWORD,
    hasPassword: !!process.env.ADMIN_PASSWORD,
  })
} 