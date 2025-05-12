// app/api/dashboard/recommendations/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/src/generated/client';

// Add BigInt serialization support
function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

function safeNextResponse(data: any, options: any = {}) {
  const body = safeJSONStringify(data);
  return new NextResponse(body, {
    ...options,
    headers: {
      ...options.headers,
      'content-type': 'application/json',
    },
  });
}

// Use PrismaClient as a singleton to prevent connection pool exhaustion
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const GET = async () => {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return safeNextResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's existing purchases to exclude them
    const userPurchases = await prisma.purchase.findMany({
      where: {
        userId,
      },
      select: {
        productId: true,
      },
    });

    const purchasedProductIds = userPurchases.map(purchase => purchase.productId);

    // Find popular products that the user hasn't purchased
    const recommendedProducts = await prisma.product.findMany({
      where: {
        id: {
          notIn: purchasedProductIds,
        },
        isPublished: true,
        inStock: true,
      },
      include: {
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { purchaseCount: 'desc' },
      ],
      take: 3,
    });

    // Transform data for the dashboard
    const recommendations = recommendedProducts.map(product => {
      // Calculate average rating
      const avgRating = product.reviews.length > 0 
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length 
        : 0;
      
      // Determine tag based on product features
      let tag = "Popular";
      if (product.featured) tag = "Featured";
      if (new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) tag = "New";
      if (product.purchaseCount > 50) tag = "Bestseller";

      return {
        id: product.id,
        title: product.title,
        description: product.description?.substring(0, 100) + (product.description && product.description.length > 100 ? '...' : '') || '',
        rating: parseFloat(avgRating.toFixed(1)),
        students: product.purchaseCount,
        price: parseFloat(product.finalPrice.toString()),
        image: product.images[0]?.url || "https://placehold.co/100x80",
        tag,
      };
    });

    // Use our safe response helper to handle BigInt values
    return safeNextResponse(recommendations);
  } catch (error) {
    console.error('Error fetching recommended resources:', error);
    return safeNextResponse(
      { 
        error: 'Failed to fetch recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
