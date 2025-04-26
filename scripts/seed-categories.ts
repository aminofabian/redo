import { db } from "@/lib/db";

async function main() {
  // Create root categories
  const nursing = await db.category.create({
    data: {
      name: "Nursing",
      slug: "nursing",
      path: "nursing",
      level: 1,
      isActive: true
    }
  });
  
  // Create child categories
  await db.category.create({
    data: {
      name: "Test Banks",
      slug: "test-banks",
      parentId: nursing.id,
      path: "nursing/test-banks",
      level: 2,
      isActive: true
    }
  });
  
  console.log("Categories seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  }); 