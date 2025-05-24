'use client';

import HardcodedReviews from './HardcodedReviews';

export default function ReviewsExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Example Product Page</h1>
      
      {/* Product details would go here */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-10">
        <p className="text-gray-700">This is an example of where your product details would appear...</p>
      </div>
      
      {/* Hardcoded Reviews Component */}
      <HardcodedReviews 
        productName="NCLEX-RN Comprehensive Review Guide" 
        maxReviews={3}
      />
    </div>
  );
}
