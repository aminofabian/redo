'use client';

import { useState } from 'react';
import { ProductReview } from '@/types/products';
import ReviewVoteButtons from './ReviewVoteButtons';
import ReviewButton from './ReviewButton';

type ReviewSectionProps = {
  reviews: ProductReview[];
  productId: number;
  productName: string;
};

export default function ReviewSection({ reviews, productId, productName }: ReviewSectionProps) {
  const approvedReviews = reviews.filter(review => review.status === 'approved');
  
  // Format date helper function
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return approvedReviews.length > 0 ? (
    <div className="space-y-6">
      {approvedReviews.map((review: ProductReview, index: number) => (
        <div key={review.id || index} className="border-b border-gray-200 pb-6 last:border-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-lg">{review.userName || "Anonymous"}</h3>
                {review.isGuest && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Guest</span>
                )}
              </div>
              <div className="flex text-yellow-400 my-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{review.rating > i ? "★" : "☆"}</span>
                ))}
              </div>
            </div>
            <span className="text-gray-500 text-sm">
              {review.createdAt 
                ? formatDate(new Date(review.createdAt)) 
                : "Unknown date"}
            </span>
          </div>
          
          <p className="text-gray-700 mb-3">{review.comment || "No review content provided."}</p>
          
          <ReviewVoteButtons reviewId={review.id} helpfulCount={review.helpfulCount} notHelpfulCount={review.notHelpfulCount} />
        </div>
      ))}
      
      {reviews.filter(r => r.status === 'pending').length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-yellow-700 text-sm">
            <span className="font-medium">Note:</span> There {reviews.filter(r => r.status === 'pending').length === 1 ? 'is' : 'are'} {reviews.filter(r => r.status === 'pending').length} pending review{reviews.filter(r => r.status === 'pending').length === 1 ? '' : 's'} awaiting moderation.
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">No approved reviews yet for this product</p>
      <ReviewButton 
        productId={productId}
        productName={productName}
        isFirstReview={true}
      />
    </div>
  );
} 