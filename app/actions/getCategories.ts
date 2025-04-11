'use server';

import prisma from "@/lib/db";

// Update the image mapping based on category slug
const categoryImages: Record<string, string> = {
  'nclex': '/categories/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg',
  'medical-surgical': '/categories/hush-naidoo-jade-photography-eKNswc0Qxz8-unsplash.jpg',
  'critical-care': '/categories/owen-beard-DK8jXx1B-1c-unsplash.jpg',
  'pediatric': '/categories/tony-luginsland-qS1bDAxxAYg-unsplash.jpg',
  'mental-health': '/categories/paul-felberbauer-QL7iY3G24z4-unsplash.jpg',
  'fundamentals': '/categories/robina-weermeijer-NIuGLCC7q54-unsplash.jpg',
  'obstetrics': '/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg'
};

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

  console.log("Database category slugs:", categories.map(c => c.slug));

  return categories.map(category => {
    const prices = category.products.map(p => Number(p.product.price));
    const avgPrice = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : 0;
    const studentCount = category.products.reduce((sum, p) => sum + (p.product.purchaseCount || 0), 0);

    const image = categoryImages[category.slug];
    console.log(`Category ${category.slug} mapped to image: ${image}`);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: category._count.products,
      averagePrice: avgPrice,
      studentCount,
      image: image || '/categories/default-category.jpg'
    };
  });
} 