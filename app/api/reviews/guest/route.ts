import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
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
    
    // For guest reviews, we need to handle them differently
    const guestUserId = "guest-user"; // You might want to store this in your database
    
    // Create the review without requiring a valid user - set status to approved for now
    const review = await prisma.review.create({
      data: {
        rating,
        comment: content,
        userName: userName || 'Anonymous Guest',
        productId: Number(productId),
        userId: guestUserId, 
        status: 'approved', // Change from 'pending' to 'approved' for immediate visibility
        isGuest: true
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted successfully',
      review 
    });
    
  } catch (error) {
    console.error('Error submitting guest review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
} 