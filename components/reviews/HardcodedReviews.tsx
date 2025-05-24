'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

// Types for our mock reviews
type MockReviewer = {
  id: string;
  name: string;
  avatar: string;
  credentials: string;
  verified: boolean;
};

type MockReview = {
  id: string;
  reviewerId: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpfulCount: number;
  notHelpfulCount: number;
  purchased: boolean;
};

// Mock reviewers data with nursing-specific profiles
const MOCK_REVIEWERS: MockReviewer[] = [
  {
    id: "rev1",
    name: "Sarah Johnson",
    avatar: "/avatars/nurse1.png", // Replace with actual path if you have these images
    credentials: "RN, BSN",
    verified: true,
  },
  {
    id: "rev2",
    name: "Michael Chen",
    avatar: "/avatars/nurse2.png",
    credentials: "RN, MSN, APRN",
    verified: true,
  },
  {
    id: "rev3",
    name: "Emily Rodriguez",
    avatar: "/avatars/nurse3.png",
    credentials: "RN, DNP",
    verified: true,
  },
  {
    id: "rev4",
    name: "David Williams",
    avatar: "/avatars/student1.png",
    credentials: "Nursing Student, Year 3",
    verified: false,
  },
  {
    id: "rev5",
    name: "Jessica Thompson",
    avatar: "/avatars/nurse4.png",
    credentials: "RN, CCRN",
    verified: true,
  },
  {
    id: "rev6",
    name: "Robert Jackson",
    avatar: "/avatars/student2.png",
    credentials: "BSN Student",
    verified: false,
  },
  {
    id: "rev7",
    name: "Amanda Lewis",
    avatar: "/avatars/nurse5.png",
    credentials: "RN, FNP-BC",
    verified: true,
  },
  {
    id: "rev8",
    name: "Kevin Patel",
    avatar: "/avatars/student3.png",
    credentials: "Nursing Student, Year 2",
    verified: false,
  }
];

// Mock reviews for nursing resources
const MOCK_REVIEWS: MockReview[] = [
  {
    id: "review1",
    reviewerId: "rev1",
    rating: 5,
    title: "Excellent NCLEX Preparation Resource",
    comment: "This is exactly what I needed to prepare for my NCLEX exam. The practice questions are comprehensive and similar to the actual exam. The explanations for each answer are detailed and helped me understand the rationale behind each correct answer. Highly recommend for any nursing student preparing for boards!",
    date: "May 15, 2025",
    helpfulCount: 42,
    notHelpfulCount: 2,
    purchased: true,
  },
  {
    id: "review2",
    reviewerId: "rev3",
    rating: 5,
    title: "Top-Notch Nursing Reference",
    comment: "As a DNP, I find this resource invaluable for both teaching and clinical practice. The content is evidence-based and up-to-date with the latest nursing protocols. My students particularly appreciate the clear illustrations and concise summaries of complex procedures.",
    date: "April 28, 2025",
    helpfulCount: 36,
    notHelpfulCount: 0,
    purchased: true,
  },
  {
    id: "review3",
    reviewerId: "rev4",
    rating: 4,
    title: "Great for Nursing Students",
    comment: "This resource has been a lifesaver during my nursing program. The pharmacology section is particularly helpful - I use it daily to review medication classes and nursing considerations. The only reason I'm giving 4 stars instead of 5 is that some of the mobile features could be improved.",
    date: "May 2, 2025",
    helpfulCount: 21,
    notHelpfulCount: 3,
    purchased: true,
  },
  {
    id: "review4",
    reviewerId: "rev2",
    rating: 5,
    title: "Perfect for APRN Practice",
    comment: "As an APRN, I needed a comprehensive resource that covers advanced assessment techniques and differential diagnoses. This exceeded my expectations. The case studies are realistic and challenge critical thinking skills. I particularly appreciate the section on geriatric assessment which I use frequently in my practice.",
    date: "May 10, 2025",
    helpfulCount: 29,
    notHelpfulCount: 1,
    purchased: true,
  },
  {
    id: "review5",
    reviewerId: "rev5",
    rating: 3,
    title: "Good Critical Care Content, Needs Updates",
    comment: "The critical care sections are detailed and helpful for CCRN preparation. However, some protocols appear to be outdated compared to the latest AHA guidelines. Would appreciate more frequent updates to keep pace with changing standards of care.",
    date: "April 15, 2025",
    helpfulCount: 18,
    notHelpfulCount: 4,
    purchased: true,
  },
  {
    id: "review6",
    reviewerId: "rev7",
    rating: 5,
    title: "Exceptional Primary Care Resource",
    comment: "This resource has become my go-to reference in my family practice. The patient education materials are particularly valuable - I use them daily with my patients. The differential diagnosis flowcharts save me significant time in clinical decision-making.",
    date: "May 5, 2025",
    helpfulCount: 27,
    notHelpfulCount: 0,
    purchased: true,
  },
  {
    id: "review7",
    reviewerId: "rev8",
    rating: 4,
    title: "Very Helpful for Fundamentals",
    comment: "As a second-year nursing student, I found the fundamentals content extremely helpful. The step-by-step guides for nursing procedures helped me prepare for skills check-offs. I wish there were more practice questions for each chapter, but overall it's been worth every penny.",
    date: "April 22, 2025",
    helpfulCount: 15,
    notHelpfulCount: 2,
    purchased: true,
  },
  {
    id: "review8",
    reviewerId: "rev6",
    rating: 4,
    title: "Great Value for BSN Students",
    comment: "I purchased this during my first semester and have used it consistently throughout my program. The pathophysiology explanations are clear and concise. The only improvement I'd suggest is adding more visual learning aids for complex concepts.",
    date: "May 18, 2025",
    helpfulCount: 11,
    notHelpfulCount: 1,
    purchased: true,
  },
  {
    id: "review9",
    reviewerId: "rev1",
    rating: 5,
    title: "Comprehensive Med-Surg Resource",
    comment: "The medical-surgical nursing content is comprehensive and well-organized. I particularly appreciate how the material connects pathophysiology with nursing interventions. The case studies help apply theoretical knowledge to realistic scenarios. This resource has been invaluable in my teaching.",
    date: "April 30, 2025",
    helpfulCount: 33,
    notHelpfulCount: 2,
    purchased: true,
  },
  {
    id: "review10",
    reviewerId: "rev3",
    rating: 2,
    title: "Good Content, Poor Digital Experience",
    comment: "While the nursing content is excellent, the digital platform is frustrating. Load times are slow and the search function often returns irrelevant results. I hope these technical issues can be addressed because the actual educational content deserves better delivery.",
    date: "May 12, 2025",
    helpfulCount: 24,
    notHelpfulCount: 3,
    purchased: true,
  }
];

type HardcodedReviewsProps = {
  productName?: string; // Optional product name to customize the component
  maxReviews?: number; // Optional number of reviews to show
};

export default function HardcodedReviews({ 
  productName = "Nursing Resource", 
  maxReviews = 5 
}: HardcodedReviewsProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = maxReviews;
  const totalPages = Math.ceil(MOCK_REVIEWS.length / reviewsPerPage);
  
  // Get current page reviews
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = MOCK_REVIEWS.slice(indexOfFirstReview, indexOfLastReview);

  // Calculate average rating
  const calculateAverageRating = (): string => {
    if (MOCK_REVIEWS.length === 0) return "0.0";
    
    const total = MOCK_REVIEWS.reduce((sum, review) => sum + review.rating, 0);
    return (total / MOCK_REVIEWS.length).toFixed(1);
  };

  // Get reviewer details by ID
  const getReviewerById = (id: string): MockReviewer => {
    return MOCK_REVIEWERS.find(reviewer => reviewer.id === id) || {
      id: "unknown",
      name: "Anonymous User",
      avatar: "",
      credentials: "",
      verified: false
    };
  };

  // Handle vote buttons (just visual, no actual functionality)
  const [votes, setVotes] = useState<Record<string, 'helpful' | 'not-helpful' | null>>({});
  
  const handleVote = (reviewId: string, voteType: 'helpful' | 'not-helpful') => {
    setVotes(prev => ({
      ...prev,
      [reviewId]: prev[reviewId] === voteType ? null : voteType
    }));
  };

  return (
    <div className="mt-12 bg-white p-8 rounded-xl shadow-sm border">
      <h2 className="text-2xl font-bold mb-8 flex items-center">
        <span className="w-2 h-7 bg-purple-600 rounded-sm mr-3"></span>
        Customer Reviews for {productName}
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
              <Star 
                key={i} 
                className={`w-6 h-6 ${parseFloat(calculateAverageRating()) > i ? "fill-yellow-400" : ""}`}
              />
            ))}
          </div>
          <p className="text-gray-500">Based on {MOCK_REVIEWS.length} verified reviews</p>
          
          {/* Rating breakdown */}
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const reviewsForRating = MOCK_REVIEWS.filter(r => r.rating === rating);
              const percentage = (reviewsForRating.length / MOCK_REVIEWS.length) * 100;
              
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
      </div>

      {/* Reviews list */}
      <div className="space-y-8 mt-10">
        {currentReviews.map(review => {
          const reviewer = getReviewerById(review.reviewerId);
          return (
            <div key={review.id} className="border-b pb-8">
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={reviewer.avatar} alt={reviewer.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-800">
                        {reviewer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{reviewer.name}</h4>
                        {reviewer.verified && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Verified
                          </span>
                        )}
                        {review.purchased && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{reviewer.credentials}</p>
                      <div className="flex text-yellow-400 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${review.rating > i ? "fill-yellow-400" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-2">{review.title}</h3>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              
              <div className="flex items-center text-sm">
                <button 
                  onClick={() => handleVote(review.id, 'helpful')}
                  className={`inline-flex items-center mr-4 px-3 py-1 rounded-full ${
                    votes[review.id] === 'helpful' 
                      ? 'bg-green-100 text-green-800' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span>Helpful ({review.helpfulCount + (votes[review.id] === 'helpful' ? 1 : 0)})</span>
                </button>
                <button 
                  onClick={() => handleVote(review.id, 'not-helpful')}
                  className={`inline-flex items-center px-3 py-1 rounded-full ${
                    votes[review.id] === 'not-helpful' 
                      ? 'bg-red-100 text-red-800' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  <span>Not Helpful ({review.notHelpfulCount + (votes[review.id] === 'not-helpful' ? 1 : 0)})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentPage === idx + 1 ? "default" : "ghost"}
                  size="sm"
                  className="w-8"
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Note:</span> These reviews are placeholder examples and do not represent actual customer opinions. The component displays hardcoded reviews for demonstration purposes.
        </p>
      </div>
    </div>
  );
}
