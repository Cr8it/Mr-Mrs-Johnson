import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
	try {
		console.log('Starting seed...')

		// Check for existing meal options
		const existingMealCount = await prisma.mealOption.count()
		console.log(`Found ${existingMealCount} existing meal options`)
		
		// Only create meal options if none exist
		if (existingMealCount === 0) {
			const mealOptions = [
				{ name: 'Chicken Supreme', isActive: true },
				{ name: 'Beef Wellington', isActive: true },
				{ name: 'Vegetarian Lasagna', isActive: true }
			]

			for (const meal of mealOptions) {
				await prisma.mealOption.create({
					data: meal
				})
			}
			console.log('Created default meal options')
		}

		// Check for existing dessert options
		const existingDessertCount = await prisma.dessertOption.count()
		console.log(`Found ${existingDessertCount} existing dessert options`)
		
		// Only create dessert options if none exist
		if (existingDessertCount === 0) {
			const dessertOptions = [
				{ name: 'Chocolate Mousse', isActive: true },
				{ name: 'Crème Brûlée', isActive: true },
				{ name: 'Fresh Fruit Tart', isActive: true }
			]

			for (const dessert of dessertOptions) {
				await prisma.dessertOption.create({
					data: dessert
				})
			}
			console.log('Created default dessert options')
		}

		// Check if test household exists
		const existingHouseholdCount = await prisma.household.count()
		console.log(`Found ${existingHouseholdCount} existing households`)
		
		if (existingHouseholdCount === 0) {
			console.log('Creating test household...')
			// Create a test household
			const household = await prisma.household.create({
				data: {
					name: 'Test Family',
					code: 'TEST123',
					guests: {
						create: [
							{
								name: 'John Doe',
								email: 'john@example.com',
							},
							{
								name: 'Jane Doe',
								email: 'jane@example.com',
							}
						]
					}
				},
				include: {
					guests: true
				}
			})
			console.log('Created test household:', household)

			// Create test activity for each guest
			for (const guest of household.guests) {
				console.log(`Creating test activity for guest ${guest.name}...`)
				const activity = await prisma.guestActivity.create({
					data: {
						guestId: guest.id,
						action: 'TEST_ACTIVITY',
						details: `Test activity log entry for ${guest.name}`
					}
				})
				console.log('Created activity:', activity)
			}
		}

		console.log('Seed completed successfully')
	} catch (error) {
		console.error('Error during seed:', error)
		throw error
	}
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})