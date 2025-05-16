'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

type ReviewVoteButtonsProps = {
  reviewId: string;
  helpfulCount: number;
  notHelpfulCount: number;
};

export default function ReviewVoteButtons({ reviewId, helpfulCount = 0, notHelpfulCount = 0 }: ReviewVoteButtonsProps) {
  const [helpful, setHelpful] = useState(helpfulCount);
  const [notHelpful, setNotHelpful] = useState(notHelpfulCount);
  const [userVote, setUserVote] = useState<'helpful' | 'notHelpful' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const handleVote = async (voteType: 'helpful' | 'notHelpful') => {
    if (userVote) {
      // User already voted
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          voteType,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }
      
      const data = await response.json();
      
      // Update counts based on vote type
      if (voteType === 'helpful') {
        setHelpful(prev => prev + 1);
      } else {
        setNotHelpful(prev => prev + 1);
      }
      
      // Record that the user has voted
      setUserVote(voteType);
      
      // Store vote in localStorage to persist between sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem(`review-vote-${reviewId}`, voteType);
      }
      
    } catch (error) {
      console.error('Error voting on review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the user has previously voted (from localStorage)
  useState(() => {
    if (typeof window !== 'undefined') {
      const previousVote = localStorage.getItem(`review-vote-${reviewId}`);
      if (previousVote === 'helpful' || previousVote === 'notHelpful') {
        setUserVote(previousVote);
      }
    }
  });

  return (
    <div className="flex space-x-3 text-sm">
      <button 
        className={`flex items-center ${
          userVote === 'helpful' 
            ? 'text-green-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => handleVote('helpful')}
        disabled={isSubmitting || userVote !== null}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        Helpful ({helpful})
        {userVote === 'helpful' && <span className="ml-1 text-xs">(Voted)</span>}
      </button>
      <button 
        className={`flex items-center ${
          userVote === 'notHelpful' 
            ? 'text-red-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => handleVote('notHelpful')}
        disabled={isSubmitting || userVote !== null}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
        </svg>
        Not Helpful ({notHelpful})
        {userVote === 'notHelpful' && <span className="ml-1 text-xs">(Voted)</span>}
      </button>
    </div>
  );
} 