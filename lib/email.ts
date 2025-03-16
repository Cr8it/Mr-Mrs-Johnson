import { Guest as PrismaGuest } from "@prisma/client"
import nodemailer from "nodemailer"

interface RsvpGuest {
  id: string
  name: string
  isAttending: boolean | null
  mealChoice: {
    id: string
    name: string
  } | null
  dessertChoice: {
    id: string
    name: string
  } | null
  dietaryNotes: string | null
  email?: string | null
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Set to false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // For development
  }
})

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take our messages");
  }
});

function generateEmailContent(guests: RsvpGuest[]) {
  const guestList = guests.map(guest => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f8f8; border-radius: 8px;">
      <h3 style="margin: 0; color: #333; font-size: 18px;">${guest.name}</h3>
      <p style="margin: 5px 0; color: #666;">Status: <span style="color: ${guest.isAttending ? '#4CAF50' : '#F44336'}">${guest.isAttending ? 'Attending' : 'Not Attending'}</span></p>
      ${guest.isAttending ? `
        <p style="margin: 5px 0; color: #666;">Meal Choice: <span style="color: #333">${guest.mealChoice?.name || 'Not selected'}</span></p>
        <p style="margin: 5px 0; color: #666;">Dessert Choice: <span style="color: #333">${guest.dessertChoice?.name || 'Not selected'}</span></p>
        ${guest.dietaryNotes ? `<p style="margin: 5px 0; color: #666;">Dietary Requirements: <span style="color: #333">${guest.dietaryNotes}</span></p>` : ''}
      ` : ''}
    </div>
  `).join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">RSVP Confirmation</h1>
        <p style="color: #666; font-size: 16px;">Sarah & Jermaine's Wedding</p>
        <p style="color: #666; font-size: 16px;">Friday 24th October 2025</p>
      </div>

      <div style="margin-bottom: 30px;">
        <p style="color: #666; text-align: center; font-size: 16px;">Thank you for your RSVP. Here's a summary of your response:</p>
      </div>

      <div style="background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ${guestList}
      </div>

      <div style="margin-top: 30px; text-align: center; color: #666;">
        <p style="margin-bottom: 10px;">You can modify your response anytime before the deadline using your household code.</p>
        <p style="font-size: 14px; color: #999;">Venue: Westernham Golf Club, Brasted Rd, Westerham TN16, UK</p>
      </div>
    </div>
  `
}

export async function sendRsvpConfirmation(guests: RsvpGuest[]) {
  // Get the first guest with an email address
  const guestWithEmail = guests.find(g => g.email)
  if (!guestWithEmail?.email) {
    console.log("No email address found for RSVP confirmation")
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Sarah & Jermaine Wedding" <noreply@example.com>',
      to: guestWithEmail.email,
      subject: "Your RSVP Confirmation - Sarah & Jermaine's Wedding",
      html: generateEmailContent(guests),
    })
    console.log("RSVP confirmation email sent to:", guestWithEmail.email)
  } catch (error) {
    console.error("Failed to send RSVP confirmation email:", error)
  }
}