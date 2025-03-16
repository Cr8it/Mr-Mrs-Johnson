import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  })
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Ensure database connection
async function connectDB() {
  try {
    await prisma.$connect()
    console.log('Successfully connected to database')
  } catch (error) {
    console.error('Failed to connect to database:', error)
    // Try to reconnect
    setTimeout(connectDB, 5000)
  }
}

// Initialize connection
connectDB()

export { prisma }



