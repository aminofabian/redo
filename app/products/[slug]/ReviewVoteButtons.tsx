'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ReviewVoteButtonsProps {
  reviewId: string | number;
  helpfulCount: number;
  notHelpfulCount: number;
}

export default function ReviewVoteButtons({ 
  reviewId, 
  helpfulCount = 0, 
  notHelpfulCount = 0 
}: ReviewVoteButtonsProps) {
  const [helpful, setHelpful] = useState(helpfulCount);
  const [notHelpful, setNotHelpful] = useState(notHelpfulCount);
  const [userVote, setUserVote] = useState<'helpful' | 'not-helpful' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (voteType: 'helpful' | 'not-helpful') => {
    if (isSubmitting) return;
    if (userVote === voteType) return; // Already voted this way

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          voteType
        }),
      });

      if (response.ok) {
        // If previously voted the opposite way
        if (userVote === 'helpful' && voteType === 'not-helpful') {
          setHelpful(prev => prev - 1);
          setNotHelpful(prev => prev + 1);
        } else if (userVote === 'not-helpful' && voteType === 'helpful') {
          setNotHelpful(prev => prev - 1);
          setHelpful(prev => prev + 1);
        } else {
          // First time voting
          if (voteType === 'helpful') {
            setHelpful(prev => prev + 1);
          } else {
            setNotHelpful(prev => prev + 1);
          }
        }
        
        setUserVote(voteType);
      } else {
        console.error('Failed to submit vote');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <p className="text-gray-500 mr-2">Was this review helpful?</p>
      
      <button 
        onClick={() => handleVote('helpful')}
        disabled={isSubmitting}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
          userVote === 'helpful' 
            ? 'bg-green-100 text-green-700' 
            : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <ThumbsUp size={16} />
        <span>{helpful}</span>
      </button>
      
      <button 
        onClick={() => handleVote('not-helpful')}
        disabled={isSubmitting}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
          userVote === 'not-helpful' 
            ? 'bg-red-100 text-red-700' 
            : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <ThumbsDown size={16} />
        <span>{notHelpful}</span>
      </button>
    </div>
  );
} 