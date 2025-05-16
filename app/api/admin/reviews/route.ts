import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin user
    const session = await getServerSession(authOptions);
    
    // For development purposes, allow access without authentication
    // REMOVE THIS IN PRODUCTION
    const bypassAuth = process.env.NODE_ENV === 'development';
    
    if (!bypassAuth && (!session?.user || session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get status from query params
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';
    
    // Fetch reviews with the specified status
    const reviews = await prisma.review.findMany({
      where: { 
        status: status 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });
    
    // Format the response
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      userName: review.userName || 'Anonymous',
      status: review.status,
      isGuest: review.isGuest,
      createdAt: review.createdAt,
      productId: review.productId,
      productTitle: review.product.title,
      productSlug: review.product.slug
    }));
    
    return NextResponse.json(formattedReviews);
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
} 