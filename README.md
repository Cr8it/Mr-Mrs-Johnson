# Sarah and Jermaine Wedding Website

A beautiful and interactive wedding website built with Next.js, featuring an admin dashboard for managing wedding details, guest lists, RSVPs, and more.

## Features

- 🔒 Secure admin dashboard
- 📋 Guest list management
- ✉️ RSVP system
- 🖼️ Photo gallery
- 👥 Bridal party management
- 📝 Custom questions
- 🍽️ Menu options
- ⚙️ Site settings

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Framer Motion
- DND Kit
- Lucide Icons
- Shadcn UI

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd sarah-and-jermaine-website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

## Environment Variables

Copy `.env.example` to `.env` and update the following variables:

- `DATABASE_URL`: SQLite database URL
- `SMTP_*`: Email configuration for notifications
- `ADMIN_*`: Admin account credentials
- `NEXT_PUBLIC_*`: Public configuration variables

## Deployment

The website can be deployed to any platform that supports Next.js applications (Vercel, Netlify, etc.).

## License

This project is private and confidential. All rights reserved. 