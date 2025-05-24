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

  // Calculate average rating helper function
  const calculateAverageRating = (): string => {
    if (!reviews || approvedReviews.length === 0) return "0.0";
    
    let total = 0;
    for (const review of approvedReviews) {
      total += review.rating || 0;
    }
    
    return (total / approvedReviews.length).toFixed(1);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;
  const totalPages = Math.ceil(approvedReviews.length / reviewsPerPage);
  
  // Get current page reviews
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = approvedReviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(indexOfFirstReview, indexOfLastReview);

  return (
    <div className="mt-12 bg-white p-8 rounded-xl shadow-sm border">
      <h2 className="text-2xl font-bold mb-8 flex items-center">
        <span className="w-2 h-7 bg-purple-600 rounded-sm mr-3"></span>
        Customer Reviews
      </h2>

      {/* Overall rating summary */}
      <div className="flex items-center mb-8">
        <div className="mr-4">
          <span className="text-5xl font-bold text-gray-900">
            {calculateAverageRating()}
          </span>
          <span className="text-xl text-gray-500">/5</span>
        </div>
        
        <div>
          <div className="flex text-yellow-400 text-2xl mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>
                {parseFloat(calculateAverageRating()) >= i + 1 
                  ? "★" 
                  : parseFloat(calculateAverageRating()) > i 
                    ? "★" 
                    : "☆"}
              </span>
            ))}
          </div>
          <p className="text-gray-500">Based on {approvedReviews.length} approved reviews</p>
          
          {/* Rating breakdown */}
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const reviewsForRating = approvedReviews.filter(r => r.rating === rating);
              const percentage = approvedReviews.length > 0 
                ? (reviewsForRating.length / approvedReviews.length) * 100 
                : 0;
              
              return (
                <div key={rating} className="flex items-center">
                  <span className="w-12 text-sm font-medium text-gray-600">{rating} stars</span>
                  <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-500 w-16">{reviewsForRating.length} reviews</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="ml-auto">
          <ReviewButton 
            productId={productId} 
            productName={productName} 
          />
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-8 mt-10">
        {approvedReviews.length > 0 ? (
          <>
            {currentReviews.map(review => (
              <div key={review.id} className="border-b pb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                        {(review.userName || 'Anonymous').charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">{review.userName || 'Anonymous'}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{review.rating > i ? "★" : "☆"}</span>
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{review.comment}</p>
                
                <div className="flex items-center text-sm">
                  <ReviewVoteButtons 
                    reviewId={review.id}
                    helpfulCount={review.helpfulCount}
                    notHelpfulCount={review.notHelpfulCount}
                  />
                </div>
              </div>
            ))}

            {/* Show review pagination if there are many reviews */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md ${currentPage === 1 ? 'text-gray-400 bg-gray-100' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-4 py-2 text-sm font-medium border border-gray-300 ${currentPage === index + 1 ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-md ${currentPage === totalPages ? 'text-gray-400 bg-gray-100' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No reviews yet for this product</p>
            <ReviewButton 
              productId={productId} 
              productName={productName} 
              label="Be the first to review this product"
            />
          </div>
        )}
      </div>

      {reviews.filter(r => r.status === 'pending').length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-yellow-700 text-sm">
            <span className="font-medium">Note:</span> There {reviews.filter(r => r.status === 'pending').length === 1 ? 'is' : 'are'} {reviews.filter(r => r.status === 'pending').length} pending review{reviews.filter(r => r.status === 'pending').length === 1 ? '' : 's'} awaiting moderation.
          </p>
        </div>
      )}
    </div>
  );
}