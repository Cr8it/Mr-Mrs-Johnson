const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Updating Niyah Dublin\'s isChild value...');

    // Find Niyah Dublin in the database
    const niyah = await prisma.guest.findFirst({
      where: {
        name: {
          contains: 'Niyah Dublin',
          mode: 'insensitive'
        }
      }
    });

    if (!niyah) {
      console.log('Could not find Niyah Dublin in the database');
      return;
    }

    console.log('Found Niyah Dublin:', niyah);
    console.log('Current isChild value:', niyah.isChild, typeof niyah.isChild);

    // Update isChild to true
    const updated = await prisma.guest.update({
      where: { id: niyah.id },
      data: { isChild: true }
    });

    console.log('Updated Niyah Dublin:', updated);
    console.log('New isChild value:', updated.isChild, typeof updated.isChild);

  } catch (error) {
    console.error('Error updating Niyah Dublin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 