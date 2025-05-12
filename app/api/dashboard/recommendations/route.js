import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { safeJSONStringify } from '@/lib/json-utils';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Using global singleton for PrismaClient to prevent connection issues
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Handler for GET requests
export async function GET(request) {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Use safe JSON serialization to handle BigInt values
    const safeData = JSON.parse(safeJSONStringify(recommendations));
    return NextResponse.json(safeData);
  } catch (error) {
    console.error('Error fetching recommended resources:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}