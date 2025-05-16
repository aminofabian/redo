import { Suspense } from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/admin/AdminLayout';
import ReviewsManagement from './ReviewsManagement';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Review Management | Admin Dashboard',
  description: 'Manage product reviews',
};

export default function AdminReviewsPage() {
  return (
    <AdminLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Review Management</h1>
        <div className="mb-4">
          <p className="text-gray-600">
            Approve or reject pending reviews. Approved reviews will be visible to all users on the product pages.
          </p>
        </div>
        
        <Suspense fallback={<LoadingSpinner />}>
          <ReviewsManagement />
        </Suspense>
      </div>
    </AdminLayout>
  );
} 