import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Cache implementation
type CacheData = {
  data: any;
  timestamp: number;
}

const CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds
const categoryDetailCache: Record<string, CacheData> = {};

export const revalidate = 3600; // Revalidate once per hour

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required" },
        { status: 400 }
      );
    }
    
    // Check if we have valid cached data for this slug
    const now = Date.now();
    if (
      categoryDetailCache[slug] && 
      now - categoryDetailCache[slug].timestamp < CACHE_DURATION
    ) {
      console.log(`Serving category detail for ${slug} from cache`);
      return NextResponse.json(categoryDetailCache[slug].data);
    }

    console.log(`Fetching fresh category detail data for ${slug}`);
    
    // Find the category by slug
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Count the products in this category
    const productCount = await prisma.product.count({
      where: {
        isPublished: true,
        categories: {
          some: {
            categoryId: category.id,
          },
        },
      },
    });

    // Get products in this category
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        categories: {
          some: {
            categoryId: category.id,
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        finalPrice: true,
        viewCount: true,
        images: {
          select: {
            url: true,
            isPrimary: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { purchaseCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: 24, // Limit to 24 products per page initially
    });

    const responseData = {
      ...category,
      productCount,
      products: products.map(product => ({
        ...product,
        finalPrice: Number(product.finalPrice), // Convert Decimal to Number for JSON
      })),
    };

    // Store in cache
    categoryDetailCache[slug] = {
      data: responseData,
      timestamp: now
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching category details:", error);
    
    // If we have cached data for this slug, return it even if it's stale
    if (categoryDetailCache[params.slug]) {
      console.log(`Returning stale cache for ${params.slug} due to error`);
      return NextResponse.json(categoryDetailCache[params.slug].data);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch category details" },
      { status: 500 }
    );
  }
}

// Utility to clear specific or all cache entries
export function clearCategoryDetailCache(slug?: string) {
  if (slug) {
    delete categoryDetailCache[slug];
    console.log(`Cache for category ${slug} cleared`);
  } else {
    Object.keys(categoryDetailCache).forEach(key => {
      delete categoryDetailCache[key];
    });
    console.log("All category detail caches cleared");
  }
} 