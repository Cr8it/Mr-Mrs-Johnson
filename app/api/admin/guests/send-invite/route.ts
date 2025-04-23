import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateInviteEmailTemplate } from "@/lib/emailTemplates"
import nodemailer from "nodemailer"

// Utility function to check if BCC is enabled
// Default to true if not specified in environment variables
function isBccEnabled() {
	return process.env.EMAIL_BCC_ENABLED === undefined || process.env.EMAIL_BCC_ENABLED === "true"
}

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

		// For development/testing, we'll simulate sending by just marking the email as sent
		// without actually sending it, unless SEND_ACTUAL_EMAILS is set to true
		const shouldSendEmail = process.env.SEND_ACTUAL_EMAILS === "true"
		
		if (shouldSendEmail) {
			await transporter.sendMail({
				from: process.env.SMTP_FROM,
				to: guest.email,
				bcc: isBccEnabled() ? process.env.SMTP_FROM : undefined,
				subject: "You're Invited to Sarah & Jermaine's Wedding!",
				html: emailHtml
			})
			
			// Log success with BCC information
			const bccStatus = isBccEnabled() ? "with BCC to admin" : "without BCC"
			console.log(`Invitation email sent to ${guest.email} ${bccStatus}`)
		} else {
			console.log(`[TEST MODE] Email would have been sent to ${guest.email} (but wasn't)`)
		}
		
		// Update guest record to mark email as sent
		const updatedGuest = await prisma.guest.update({
			where: { id: guestId },
			data: {
				emailSent: true,
				emailSentAt: new Date()
			}
		})
		
		// Log this activity
		await prisma.guestActivity.create({
			data: {
				guestId: guestId,
				action: "EMAIL_SENT",
				details: shouldSendEmail ? "Email sent" : "Email marked as sent (test mode)"
			}
		})

		return NextResponse.json({ success: true, emailSent: updatedGuest.emailSent, emailSentAt: updatedGuest.emailSentAt })
	} catch (error) {
		console.error("Send invite error:", error)
		return NextResponse.json(
			{ error: "Failed to send invite" },
			{ status: 500 }
		)
	}
}