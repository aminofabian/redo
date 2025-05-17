import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId);
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const reviews = await prisma.review.findMany({
      where: {
        productId: productId,
        status: 'approved'  // Only fetch approved reviews
      },
      orderBy: {
        createdAt: 'desc' // Most recent first
      }
    });
    
    console.log(`Found ${reviews.length} reviews for product ${productId}`);
    
    return NextResponse.json(reviews.map(review => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString()
    })));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
} 