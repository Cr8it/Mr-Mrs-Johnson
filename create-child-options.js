const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to create child options...');

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

    console.log('Successfully created child options!');
    console.log('Meal options created:', mealOptions);
    console.log('Dessert options created:', dessertOptions);

  } catch (error) {
    console.error('Error creating child options:', error);
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