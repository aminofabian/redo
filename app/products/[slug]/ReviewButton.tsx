'use client';

import { useState } from 'react';
import ReviewModal from './ReviewModal';
import { useSession } from 'next-auth/react';

interface ReviewButtonProps {
  productId: number;
  productName: string;
  label?: string;
  isFirstReview?: boolean;
}

export default function ReviewButton({ productId, productName, label = "Write a Review", isFirstReview = false }: ReviewButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleSubmitReview = async (review: { rating: number; content: string; userName: string }) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reviews/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: review.rating,
          content: review.content,
          userName: review.userName || 'Guest Reviewer',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }
      
      alert('Thank you for your review! It will appear after moderation.');
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error submitting review:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <button 
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        onClick={handleButtonClick}
      >
        {isFirstReview ? 'Be the first to review' : label}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <ReviewModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
        }}
        onSubmit={handleSubmitReview}
        productId={productId}
        productName={productName}
      />
    </>
  );
} 