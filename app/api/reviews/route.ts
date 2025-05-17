import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Make sure you have this import set up
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    // Get the current user from the session
    const session = await auth();
    
    // Check if user exists and has an email
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a review' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { productId, rating, content, userName } = await req.json();
    
    // Validate the input
    if (!productId || !rating || !content) {
      return NextResponse.json(
        { error: 'Product ID, rating, and review content are required' },
        { status: 400 }
      );
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: Number(productId),
        userId: session.user.email,
      },
    });
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }
    
    // Create the review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: content,
        userName: userName || 'Anonymous',
        productId: Number(productId),
        userId: session.user.email,
        status: 'pending', // Reviews start as pending for moderation
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted successfully and is pending approval',
      review 
    });
    
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
} 