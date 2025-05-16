import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    // Authenticate admin user
    const session = await getServerSession(authOptions);
    
    // For development purposes, allow access without authentication
    // REMOVE THIS IN PRODUCTION
    const bypassAuth = process.env.NODE_ENV === 'development';
    
    if (!bypassAuth && (!session?.user || session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { reviewId, status } = await req.json();
    
    if (!reviewId || !status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Update the review status
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { status }
    });
    
    return NextResponse.json({ 
      success: true,
      message: `Review ${status}`,
      review: updatedReview
    });
    
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { error: 'Failed to update review status' },
      { status: 500 }
    );
  }
} 