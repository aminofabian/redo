"use server";

import { db } from "@/lib/db";

export async function getFeaturedProducts() {
  try {
    const featuredProducts = await db.product.findMany({
      where: {
        featured: true,
        isPublished: true,
        inStock: true
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      take: 8,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return featuredProducts.map(product => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price.toNumber(),
      finalPrice: product.finalPrice.toNumber(),
      discountPercent: product.discountPercent,
      imageUrl: product.images[0]?.url || '/placeholder-product.jpg',
      primaryCategory: product.categories[0]?.category ? {
        id: product.categories[0].category.id,
        name: product.categories[0].category.name,
        slug: product.categories[0].category.slug,
        path: product.categories[0].category.slug
      } : null,
      categoryPaths: []
    }));
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
} 