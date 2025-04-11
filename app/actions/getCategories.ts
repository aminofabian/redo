'use server';

import prisma from "@/lib/db";

const categoryImages = [
  '/categories/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg',
  '/categories/hush-naidoo-jade-photography-eKNswc0Qxz8-unsplash.jpg',
  '/categories/olga-guryanova-tMFeatBSS4s-unsplash.jpg',
  '/categories/marissa-grootes-flRm0z3MEoA-unsplash.jpg',
  '/categories/sincerely-media--IIIr1Hu6aY-unsplash.jpg',
  '/categories/fahrul-azmi-cFUZ-6i83vs-unsplash.jpg',
  '/categories/julia-taubitz-6JUYocDPaZo-unsplash.jpg',
  '/categories/owen-beard-DK8jXx1B-1c-unsplash.jpg',
  '/categories/paul-felberbauer-QL7iY3G24z4-unsplash.jpg',
  '/categories/robina-weermeijer-NIuGLCC7q54-unsplash.jpg',
  '/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg',
  '/categories/tony-luginsland-qS1bDAxxAYg-unsplash.jpg',
  '/categories/alexander-grey-eMP4sYPJ9x0-unsplash.jpg'
];

export async function getCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: { products: true }
      },
      products: {
        select: {
          product: {
            select: {
              price: true,
              purchaseCount: true
            }
          }
        }
      }
    }
  });

  // Debug logging
  console.log("Available image mappings:", categoryImages);
  console.log("Database category slugs:", categories.map(c => c.slug));

  return categories.map((category, index) => {
    const prices = category.products.map(p => Number(p.product.price));
    const avgPrice = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : 0;
    const studentCount = category.products.reduce((sum, p) => sum + (p.product.purchaseCount || 0), 0);

    console.log(`Category "${category.slug}" mapped to image: "${categoryImages[index % categoryImages.length]}"`);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: category._count.products,
      averagePrice: avgPrice,
      studentCount,
      image: categoryImages[index % categoryImages.length]
    };
  });
} 