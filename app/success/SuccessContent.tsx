'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/lib/CartContext'
import { CheckCircle, AlertCircle, ShoppingBag, Download, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface VerificationResponse {
  success: boolean
  message: string
  orderId?: string
  orderDetails?: {
    id: string
    totalAmount: number
    items: Array<{
      id: string
      title: string
      price: number
      quantity: number
      downloadAvailable?: boolean
    }>
  }
}

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null)
  
  useEffect(() => {
    // Get payment provider and session ID from URL parameters
    const sessionId = searchParams.get('session_id')
    const paymentId = searchParams.get('paymentId') // PayPal parameter
    const paymentProvider = searchParams.get('provider') || 'stripe' // Default to stripe if not specified
    
    if (!sessionId && !paymentId) {
      setError('No payment session found')
      setIsLoading(false)
      return
    }
    
    // Verify payment and update database
    const verifyPayment = async () => {
      try {
        // Determine which API endpoint to call based on payment provider
        const endpoint = paymentProvider === 'paypal'
          ? `/api/paypal/verify-payment?paymentId=${paymentId}`
          : `/api/stripe/verify-payment?session_id=${sessionId}`
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result: VerificationResponse = await response.json()
        
        if (result.success) {
          // Payment was successful - update the result state
          setVerificationResult(result)
          // Clear the shopping cart
          clearCart()
        } else {
          // Payment verification failed
          setError(result.message || 'Payment verification failed')
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        setError('An error occurred while verifying your payment')
      } finally {
        setIsLoading(false)
      }
    }
    
    verifyPayment()
  }, [searchParams, clearCart])
  
  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Processing Your Order</h1>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/cart">Return to Cart</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Success state
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-1">Thank you for your purchase</p>
        {verificationResult?.orderId && (
          <p className="text-sm text-gray-500">Order ID: {verificationResult.orderId}</p>
        )}
      </div>
      
      {/* Order summary */}
      {verificationResult?.orderDetails && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          </div>
          <div className="px-6 py-4">
            <div className="divide-y divide-gray-200">
              {verificationResult.orderDetails.items.map((item) => (
                <div key={item.id} className="py-4 flex justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    {item.downloadAvailable && (
                      <Link 
                        href={`/dashboard/materials`} 
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        <span>Download</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between">
                <p className="text-base font-medium text-gray-900">Total</p>
                <p className="text-base font-medium text-gray-900">
                  ${verificationResult.orderDetails.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/materials">
            <ShoppingBag className="h-5 w-5 mr-2" />
            View My Purchases
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/store">
            Continue Shopping
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}