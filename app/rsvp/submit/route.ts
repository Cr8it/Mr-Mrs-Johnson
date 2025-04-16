// If the file exists, make sure the guest update preserves isChild
// For example, in the update data:

await prisma.guest.update({
  where: {
    id: guest.id,
  },
  data: {
    isAttending,
    mealOptionId: isAttending ? mealOptionId : null,
    dessertOptionId: isAttending ? dessertOptionId : null,
    // Don't update isChild - it should remain as set in the database
  },
}); 