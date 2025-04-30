import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a category first
  const category = await prisma.category.upsert({
    where: { name: 'Example Category' },
    update: {},
    create: {
      name: 'Example Category',
      slug: 'example-category',
    },
  });

  // Create a user
  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'leilakitto@gmail.com',
      password: 'tobby@123#', // You should hash passwords in real apps
    },
  });

  // Seed a product
  const product = await prisma.product.create({
    data: {
      title: 'Sample Product',
      description: 'This is a sample product description.',
      price: 29.99,
      isPublished: true,
      finalPrice: 29.99,
      slug: `sample-product-${Date.now()}`,
      createdById: user.id, // <-- use the created user's ID
      images: {
        create: [
          {
            url: '/images/image1.jpg',
            alt: 'First Image',
            isPrimary: true,
          },
          {
            url: '/images/image2.jpg',
            alt: 'Second Image',
            isPrimary: false,
          },
        ],
      },
      categories: {
        create: [
          {
            category: {
              connect: { id: category.id },
            },
          },
        ],
      },
    },
  });

  console.log('Seeded product:', product);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
