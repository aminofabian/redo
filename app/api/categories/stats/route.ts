import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

type Category = Awaited<ReturnType<PrismaClient['category']['findFirst']>>
type Product = Awaited<ReturnType<PrismaClient['product']['findFirst']>>
type ProductImage = Awaited<ReturnType<PrismaClient['productImage']['findFirst']>>

type CategoryWithProducts = Category & {
  products?: Product[];
  images?: ProductImage[];
}

// Cache implementation
type CacheData = {
  data: any;
  timestamp: number;
}

const CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds
let categoryStatsCache: CacheData | null = null;

export const revalidate = 3600; // Revalidate once per hour

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (
      categoryStatsCache && 
      now - categoryStatsCache.timestamp < CACHE_DURATION
    ) {
      console.log("Serving category stats from cache");
      return NextResponse.json(categoryStatsCache.data);
    }

    console.log("Fetching fresh category stats data");
    // Alternative approach using separate count queries
    const categories = await db.category.findMany({
      where: {} // No filters to return all categories
    });
    const categoryCounts = await Promise.all(
      categories.map((category: Category) => 
        db.product.count({
          where: {
            categories: {
              some: { categoryId: category!.id }
            }
          }
        })
      )
    );

    // Get total products count for percentage calculation
    const totalProducts = await db.product.count({
      where: { isPublished: true }
    });

    // Get popular products per category (top seller in each category)
    const categoryStats = await Promise.all(
      categories
        .filter((category): category is NonNullable<typeof category> => category !== null)
        .map(async (category, index) => {
          // Find products in this category
          const productsInCategory = await db.product.findMany({
            where: {
              isPublished: true,
              categories: {
                some: {
                  categoryId: category!.id,
                },
              },
            },
            orderBy: [
              { viewCount: "desc" },
              { purchaseCount: "desc" },
            ],
            take: 1,
            include: {
              images: true,
            },
          });

          // Get average price for this category
          const avgPriceResult = await db.product.aggregate({
            where: {
              isPublished: true,
              categories: {
                some: {
                  categoryId: category!.id,
                },
              },
            },
            _avg: {
              finalPrice: true,
            },
          });

          const topSeller = productsInCategory[0] || null;
          const topSellerImage = topSeller?.images
            .filter((img): img is NonNullable<typeof img> => img !== null)
            .find(img => img.isPrimary)?.url || 
            (topSeller?.images[0]?.url || "/placeholder-image.jpg");

          return {
            id: category!.id,
            name: category!.name,
            description: category!.description,
            slug: category!.slug,
            productCount: categoryCounts[index] || 0,
            percentage: totalProducts > 0 
              ? Math.round((categoryCounts[index] || 0) / totalProducts) * 100
              : 0,
            avgPrice: avgPriceResult._avg.finalPrice 
              ? Number(avgPriceResult._avg.finalPrice) 
              : 0,
            topSeller: topSeller 
              ? {
                  id: topSeller.id,
                  title: topSeller.title,
                  image: topSellerImage,
                  price: Number(topSeller.finalPrice),
                  viewCount: topSeller.viewCount,
                } 
              : null,
          };
        })
    );

    // Sort by product count (highest first)
    categoryStats.sort((a, b) => b.productCount - a.productCount);

    // Store in cache
    categoryStatsCache = {
      data: categoryStats,
      timestamp: now
    };

    return NextResponse.json(categoryStats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    
    // If we have cached data, return it even if it's stale
    if (categoryStatsCache) {
      console.log("Returning stale cache due to error");
      return NextResponse.json(categoryStatsCache.data);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch category statistics" },
      { status: 500 }
    );
  }
}

// Utility to clear the cache if needed (could be exported for use in admin routes)
export function clearCategoryStatsCache() {
  categoryStatsCache = null;
  console.log("Category stats cache cleared");
} 