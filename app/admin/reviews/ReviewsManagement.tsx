'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type Review = {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  status: string;
  isGuest: boolean;
  createdAt: string;
  productId: number;
  productTitle?: string;
};

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/reviews?status=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    await updateReviewStatus(reviewId, 'approved');
  };

  const handleReject = async (reviewId: string) => {
    await updateReviewStatus(reviewId, 'rejected');
  };

  const updateReviewStatus = async (reviewId: string, status: string) => {
    setActionInProgress(reviewId);
    
    try {
      const response = await fetch('/api/admin/reviews/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          status,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update review status');
      }
      
      // Remove the review from the current list if we're changing its status
      if (activeTab === 'pending') {
        setReviews(reviews.filter(review => review.id !== reviewId));
      } else {
        // Refresh the list
        fetchReviews();
      }
      
    } catch (err) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} review:`, err);
      setError(`Failed to ${status === 'approved' ? 'approve' : 'reject'} review. Please try again.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <span key={i}>{i < rating ? '★' : '☆'}</span>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'approved'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'rejected'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No {activeTab} reviews found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {activeTab === 'pending' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <a href={`/products/${review.productId}`} target="_blank" className="hover:underline">
                        {review.productTitle || `Product #${review.productId}`}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-semibold mb-1">{review.userName} {review.isGuest && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 ml-1">Guest</span>}</div>
                    <div className="text-sm text-gray-500 max-w-md">{review.comment}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                  </td>
                  {activeTab === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={actionInProgress === review.id}
                          className="text-green-600 hover:text-green-800 flex items-center disabled:opacity-50"
                        >
                          <CheckCircle className="w-5 h-5 mr-1" />
                          {actionInProgress === review.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={actionInProgress === review.id}
                          className="text-red-600 hover:text-red-800 flex items-center ml-3 disabled:opacity-50"
                        >
                          <XCircle className="w-5 h-5 mr-1" />
                          {actionInProgress === review.id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 