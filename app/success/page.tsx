// app/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';

export default function SuccessPage() {
    const { clearCart } = useCart();
  
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  console.log(sessionId, 'why..........')
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setIsLoading(false);
      return;
    }

    // Verify the payment and get order details
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`);
        const data = await response.json();
        // console.log(data, 'interesting data...........::::::::::::::::::::::::::::::::')

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setOrderDetails(data);
        clearCart();
                
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
        // console.error('Payment verification error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Processing your order...</h1>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Processing Error</h1>
          <p className="mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
          <p className="text-gray-600 mt-2">Thank you for your purchase.</p>
        </div>

        {orderDetails && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
            {orderDetails.items && (
              <ul className="space-y-2 mb-4">
                {orderDetails.items.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.description}</span>
                    <span>${(item.amount_total / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>${((orderDetails.amount_total || 0) / 100).toFixed(2)}</span>
            </div>
            
            {orderDetails.customer_details && (
              <div className="mt-4">
                <h2 className="font-semibold text-lg mb-2">Customer Details</h2>
                <p>{orderDetails.customer_details.name}</p>
                <p>{orderDetails.customer_details.email}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}