import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to vote on reviews' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { reviewId, voteType } = await req.json();
    
    if (!reviewId || !voteType || !['helpful', 'notHelpful'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Get the current review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Update the helpful or not helpful count
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: voteType === 'helpful' 
          ? { increment: 1 } 
          : undefined,
        notHelpfulCount: voteType === 'notHelpful' 
          ? { increment: 1 } 
          : undefined,
      },
    });
    
    return NextResponse.json({ 
      success: true,
      review: updatedReview 
    });
    
  } catch (error) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { error: 'Failed to register vote' },
      { status: 500 }
    );
  }
} 