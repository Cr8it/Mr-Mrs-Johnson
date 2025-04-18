const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to create child options...');

    // Get all existing options for debugging
    const existingMeals = await prisma.mealOption.findMany();
    console.log('Existing meal options:', existingMeals);
    
    const existingDesserts = await prisma.dessertOption.findMany();
    console.log('Existing dessert options:', existingDesserts);

    // First, ensure any existing child options are marked as inactive
    await prisma.mealOption.updateMany({
      where: { isChildOption: true },
      data: { isActive: false }
    });
    await prisma.dessertOption.updateMany({
      where: { isChildOption: true },
      data: { isActive: false }
    });

    // Create child meal options
    const mealOptions = await prisma.mealOption.createMany({
      data: [
        { 
          name: "Kid's Chicken Nuggets & Fries",
          isChildOption: true,
          isActive: true
        },
        { 
          name: "Kid's Mac & Cheese",
          isChildOption: true,
          isActive: true
        },
        { 
          name: "Kid's Fish Fingers & Chips",
          isChildOption: true,
          isActive: true
        }
      ],
      skipDuplicates: true
    });
    
    // Create child dessert options
    const dessertOptions = await prisma.dessertOption.createMany({
      data: [
        { 
          name: "Kid's Ice Cream Sundae",
          isChildOption: true,
          isActive: true
        },
        { 
          name: "Kid's Chocolate Brownie",
          isChildOption: true,
          isActive: true
        },
        { 
          name: "Kid's Fruit & Jelly",
          isChildOption: true,
          isActive: true
        }
      ],
      skipDuplicates: true
    });

    // Verify the options after creation
    const finalMeals = await prisma.mealOption.findMany();
    console.log('Final meal options:', finalMeals);
    
    const finalDesserts = await prisma.dessertOption.findMany();
    console.log('Final dessert options:', finalDesserts);
    
    // Get filtered child options to verify filtering works
    const childMeals = await prisma.mealOption.findMany({
      where: {
        isChildOption: true,
        isActive: true
      }
    });
    console.log('Child meal options:', childMeals);
    
    const childDesserts = await prisma.dessertOption.findMany({
      where: {
        isChildOption: true,
        isActive: true
      }
    });
    console.log('Child dessert options:', childDesserts);

    console.log('Successfully updated menu options!');
    console.log('Meal options created:', mealOptions);
    console.log('Dessert options created:', dessertOptions);

  } catch (error) {
    console.error('Error updating menu options:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 