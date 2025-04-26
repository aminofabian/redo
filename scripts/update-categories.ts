import { db } from "@/lib/db";

async function main() {
  // Get all categories
  const categories = await db.category.findMany();
  
  // Update each category with default values for new fields
  for (const category of categories) {
    await db.category.update({
      where: { id: category.id },
      data: {
        path: category.slug,
        level: category.parentId ? 2 : 1,
        isActive: true
      }
    });
  }
  
  console.log("Categories updated successfully!");
}

main(); 