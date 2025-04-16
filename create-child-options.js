const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create child meal options
  await prisma.mealOption.createMany({
    data: [
      { name: "Kid's Chicken Fingers", isChildOption: true, isActive: true },
      { name: "Kid's Pasta", isChildOption: true, isActive: true }
    ],
    skipDuplicates: true
  });
  
  // Create child dessert options
  await prisma.dessertOption.createMany({
    data: [
      { name: "Kid's Ice Cream", isChildOption: true, isActive: true },
      { name: "Kid's Chocolate Cake", isChildOption: true, isActive: true }
    ],
    skipDuplicates: true
  });
  
  console.log('Created child options!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect()); 