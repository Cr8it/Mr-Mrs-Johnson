import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateInviteEmailTemplate } from "@/lib/emailTemplates"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false
	}
})

export async function POST(request: Request) {
	try {
		const { guestId } = await request.json()

		const guest = await prisma.guest.findUnique({
			where: { id: guestId },
			include: {
				household: true
			}
		})

		if (!guest) {
			return NextResponse.json(
				{ error: "Guest not found" },
				{ status: 404 }
			)
		}

		if (!guest.email) {
			return NextResponse.json(
				{ error: "Guest has no email address" },
				{ status: 400 }
			)
		}

		const emailHtml = generateInviteEmailTemplate(guest)

		await transporter.sendMail({
			from: process.env.SMTP_FROM,
			to: guest.email,
			subject: "You're Invited to Sarah & Jermaine's Wedding!",
			html: emailHtml
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Send invite error:", error)
		return NextResponse.json(
			{ error: "Failed to send invite" },
			{ status: 500 }
		)
	}
}