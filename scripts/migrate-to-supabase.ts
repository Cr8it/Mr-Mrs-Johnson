import { PrismaClient } from '@prisma/client'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

async function main() {
  console.log('Starting migration...')
  
  // Connect to SQLite database
  const sqlite = await open({
    filename: 'prisma/dev.db',
    driver: sqlite3.Database
  })

  // Initialize Prisma client for Postgres
  const prisma = new PrismaClient()
  
  try {
    // Migrate Settings
    console.log('Migrating Settings...')
    const settings = await sqlite.all('SELECT * FROM Settings')
    console.log('Found settings:', settings)
    
    if (settings.length > 0) {
      await prisma.settings.create({
        data: {
          id: settings[0].id,
          weddingDate: settings[0].weddingDate ? new Date(settings[0].weddingDate) : null,
          venueName: settings[0].venueName || "",
          venueAddress: settings[0].venueAddress || "",
          ceremonyTime: settings[0].ceremonyTime || "",
          receptionTime: settings[0].receptionTime || "",
          primaryColor: settings[0].primaryColor || "#d4af37",
          accentColor: settings[0].accentColor || "#000000",
          backgroundImage: settings[0].backgroundImage || "",
        }
      })
    }

    // Migrate MealOptions
    console.log('Migrating Meal Options...')
    const mealOptions = await sqlite.all('SELECT * FROM MealOption')
    console.log('Found meal options:', mealOptions)
    
    for (const meal of mealOptions) {
      await prisma.mealOption.create({
        data: {
          id: meal.id,
          name: meal.name,
          isActive: Boolean(meal.isActive),
          createdAt: new Date(meal.createdAt),
          updatedAt: new Date(meal.updatedAt)
        }
      })
    }

    // Migrate DessertOptions
    console.log('Migrating Dessert Options...')
    const dessertOptions = await sqlite.all('SELECT * FROM DessertOption')
    console.log('Found dessert options:', dessertOptions)
    
    for (const dessert of dessertOptions) {
      await prisma.dessertOption.create({
        data: {
          id: dessert.id,
          name: dessert.name,
          isActive: Boolean(dessert.isActive),
          createdAt: new Date(dessert.createdAt),
          updatedAt: new Date(dessert.updatedAt)
        }
      })
    }

    // Migrate Questions
    console.log('Migrating Questions...')
    const questions = await sqlite.all('SELECT * FROM Question')
    console.log('Found questions:', questions)
    
    for (const question of questions) {
      await prisma.question.create({
        data: {
          id: question.id,
          question: question.question,
          type: question.type,
          options: question.options || "",
          isRequired: Boolean(question.isRequired),
          isActive: Boolean(question.isActive),
          perGuest: Boolean(question.perGuest),
          order: question.order,
          createdAt: new Date(question.createdAt),
          updatedAt: new Date(question.updatedAt)
        }
      })
    }

    // Migrate BridalPartyMembers
    console.log('Migrating Bridal Party Members...')
    const bridalPartyMembers = await sqlite.all('SELECT * FROM BridalPartyMember')
    console.log('Found bridal party members:', bridalPartyMembers)
    
    for (const member of bridalPartyMembers) {
      await prisma.bridalPartyMember.create({
        data: {
          id: member.id,
          name: member.name,
          role: member.role,
          description: member.description,
          imageUrl: member.imageUrl,
          type: member.type,
          order: member.order,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt)
        }
      })
    }

    // Migrate Households and Guests
    console.log('Migrating Households and Guests...')
    const households = await sqlite.all('SELECT * FROM Household')
    console.log('Found households:', households)
    
    for (const household of households) {
      await prisma.household.create({
        data: {
          id: household.id,
          name: household.name,
          code: household.code,
          createdAt: new Date(household.createdAt),
          updatedAt: new Date(household.updatedAt)
        }
      })

      // Get and migrate guests for this household
      const guests = await sqlite.all('SELECT * FROM Guest WHERE householdId = ?', household.id)
      console.log(`Found ${guests.length} guests for household ${household.name}`)
      
      for (const guest of guests) {
        await prisma.guest.create({
          data: {
            id: guest.id,
            name: guest.name,
            email: guest.email,
            isAttending: guest.isAttending === null ? null : Boolean(guest.isAttending),
            mealOptionId: guest.mealOptionId,
            dessertOptionId: guest.dessertOptionId,
            dietaryNotes: guest.dietaryNotes,
            householdId: guest.householdId,
            createdAt: new Date(guest.createdAt),
            updatedAt: new Date(guest.updatedAt)
          }
        })
      }
    }

    // Migrate QuestionResponses
    console.log('Migrating Question Responses...')
    const responses = await sqlite.all('SELECT * FROM QuestionResponse')
    console.log('Found responses:', responses)
    
    for (const response of responses) {
      await prisma.questionResponse.create({
        data: {
          id: response.id,
          questionId: response.questionId,
          guestId: response.guestId,
          answer: response.answer,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt)
        }
      })
    }

    // Migrate GuestActivities
    console.log('Migrating Guest Activities...')
    const activities = await sqlite.all('SELECT * FROM GuestActivity')
    console.log('Found activities:', activities)
    
    for (const activity of activities) {
      await prisma.guestActivity.create({
        data: {
          id: activity.id,
          guestId: activity.guestId,
          action: activity.action,
          details: activity.details,
          createdAt: new Date(activity.createdAt)
        }
      })
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    await sqlite.close()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 