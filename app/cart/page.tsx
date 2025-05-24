'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight, Package, ArrowLeft, Loader2 } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';
import { toast } from "react-hot-toast";
import { safeJsonStringify } from '@/lib/json';
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

// Initialize Stripe
const stripePromise = (() => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('Missing Stripe publishable key in environment variables');
    return null;
  }
  return loadStripe(key);
})();

// API endpoints
const API_ENDPOINTS = {
  paymentGateways: '/api/payment-gateways',
  paypalSdk: '/api/paypal-sdk',
  order: '/api/order'
};

// Type definition for payment gateways
interface PaymentGateway {
  id: string;
  name: string;
  isActive: boolean;
  environment: string;
  businessName: string | null;
  supportsCreditCards: boolean;
  supportsDirectDebit: boolean;
};

// Helper function to replace BigInt for JSON serialization
function replaceBigInt(key: string, value: any) {
  // Convert BigInt to String when encountered
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// PayPal components
const LoadPayPal = () => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  if(isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  } else if(isRejected) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-red-500">Failed to load PayPal script</p>
      </div>
    )
  }
  return null;
}

function PayPalButtonsWrapper({ options, children }: { options: ReactPayPalScriptOptions, children: React.ReactNode }) {
  return (
    <PayPalScriptProvider options={options}>
      {children}
    </PayPalScriptProvider>
  );
}

const PayPalButtonWrapper = ({ clientId, onLoad }: { clientId: string, onLoad: () => void }) => {
  return (
    <PayPalScriptProvider 
      options={{
        clientId: clientId,
        currency: "USD",
        components: "buttons",
      }}
    >
      <PayPalButtonContent onLoad={onLoad} />
    </PayPalScriptProvider>
  );
};

const PayPalCheckoutButton = ({ onReadyCallback, amount }: { onReadyCallback: () => void, amount: string }) => {
  // Make sure amount is greater than zero
  const safeAmount = Number(amount) <= 0 ? "1.00" : amount;
  const { clearCart } = useCart();
  
  return (
    <PayPalButtons
      style={{ layout: "vertical" }}
      createOrder={(data, actions) => {
        console.log("Creating PayPal order with amount:", safeAmount);
        return actions.order.create({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                value: safeAmount,
                currency_code: "USD"
              },
              description: "Your purchase",
            },
          ],
          application_context: {
            shipping_preference: "NO_SHIPPING"
          }
        });
      }}
      onApprove={(data, actions) => {
        if (!actions.order) {
          console.error("Order actions not available");
          return Promise.reject("Order actions not available");
        }
      
        return actions.order.capture().then(async (details) => {
          console.log("Payment successful", details);
      
          // Ensure orderId is initialized (from state or localStorage)
          const currentOrderId = localStorage.getItem('orderId');
          if (!currentOrderId) {
            console.error("Order ID is not available");
            toast.error("Order ID not found. Please try again.");
            return;
          }
      
          // Send details to your backend
          try {
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: currentOrderId,
                paypalOrderDetails: details
              }),
            });
      
            if (!res.ok) throw new Error("Failed to store transaction");
            const responseData = await res.json();
            console.log("Server response:", responseData);
          } catch (err) {
            console.error("Error sending PayPal capture to backend", err);
            toast.error("Failed to store transaction. Please contact support.");
          }
          clearCart();
          localStorage.removeItem('orderId');          
          toast.success(`Payment completed! Thank you ${details.payer?.name?.given_name || ''}!`);
        });
      }}
      onError={(err) => {
        console.error("PayPal error:", err);
        toast.error("Payment failed. Please try again.");
      }}
    />
  );
};

const PayPalButtonContent = ({ onLoad }: { onLoad: () => void }) => {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  const { totalPrice } = useCart(); // Access cart total directly
  
  useEffect(() => {
    if (isResolved) {
      onLoad();
    }
  }, [isResolved, onLoad]);
  
  if (isPending) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  
  // Format total as string with two decimal places
  const formattedTotal = Number(totalPrice).toFixed(2);
  return <PayPalCheckoutButton onReadyCallback={() => {}} amount={formattedTotal} />;
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paypalOptions, setPaypalOptions] = useState({
    clientId: "",
    currency: "USD",
    intent: "capture",
    components: "buttons,funding-eligibility",
    'data-client-token': 'abc123',
  });
  const [paypalMainLoaded, setPaypalMainLoaded] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [totalPayout, setTotalPayout] = useState<string>('0.00');
  const { data: session } = useSession();
  
  // Store orderId in localStorage
  useEffect(() => {
    if (orderId) {
      localStorage.setItem('orderId', orderId);
    }
  }, [orderId]);

  // Fetch PayPal client ID
  const fetchPaypalClientId = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.paypalSdk);
      if (!response.ok) throw new Error('Failed to fetch PayPal configuration');
      const data = await response.json();
      console.log('Fetched PayPal configuration:', data);
      
      setPaypalOptions({
        clientId: data.clientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        currency: data.currency || "USD",
        intent: data.intent || "capture",
        components: "buttons",
        'data-client-token': data.clientToken || 'abc123',
      });
    } catch (error) {
      console.error('Error fetching PayPal configuration:', error);
      
      // Fallback
      setPaypalOptions({
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        currency: "USD",
        intent: "capture",
        components: "buttons",
        'data-client-token': 'abc123',
      });
      
      toast.error('Failed to load PayPal. Please try another payment method.');
    }
  };
  
  // Fetch payment gateways
  const fetchPaymentGateways = async () => {
    setIsProcessingCheckout(true);
    try {
      const response = await fetch(API_ENDPOINTS.paymentGateways);
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data = await response.json();
      console.log('Fetched payment gateways:', data.gateways);
      setPaymentGateways(data.gateways);

      // If PayPal is in the list, fetch its clientId automatically
      const hasPaypal = data.gateways.find((gateway: PaymentGateway) => gateway.name === 'PAYPAL');
      if (hasPaypal) {
        await fetchPaypalClientId();
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      toast.error('Failed to load payment methods. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };
  
  // Handle Stripe checkout
  const handleStripeCheckout = async () => {
    setIsProcessingCheckout(true);

    try {
      console.log("Initializing checkout with Stripe");
      
      // Create checkout session - use replaceBigInt for serialization
      const response = await fetch('/api/stripe/checkout-sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeJsonStringify({
          cartItems: items,
          orderId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        toast.error(errorData.error || 'Failed to create checkout session');
        setIsProcessingCheckout(false);
        return;
      }

      const { sessionId } = await response.json();
      console.log('Created session ID:', sessionId);
      
      // Use the pre-initialized stripePromise
      if (!stripePromise) {
        console.error('Stripe failed to initialize. Check your key.');
        toast.error('Payment system unavailable. Please try again later.');
        setIsProcessingCheckout(false);
        return;
      }
      
      const stripe = await stripePromise;
      if (!stripe) {
        console.error('Could not load Stripe');
        toast.error('Payment system unavailable');
        setIsProcessingCheckout(false);
        return;
      }
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        console.error('Stripe checkout error:', stripeError);
        toast.error(`Payment error: ${stripeError.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Payment processing failed. Please try again.');
    }

    setIsProcessingCheckout(false);
  };
  
  // Validate email for guest checkout
  const validateEmail = (email: string) => {
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim() === '') {
      setEmailError('Email is required');
      toast.error('Please enter your email address');
      return false;
    } 
    
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return false;
    }
    
    // Clear any previous error
    setEmailError('');
    return true;
  };
  
  // Handle email submission for guest checkout
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submit form triggered with:', guestEmail);
    
    if (validateEmail(guestEmail)) {
      setShowEmailForm(false);
      // Continue to payment processing
      handleProceedToPayment();
    }
  };
  
  // Handle proceed to payment
  const handleProceedToPayment = async () => {
    try {
      // Clear any previous state
      setShowEmailForm(false);
      
      console.log("Proceeding to payment with session:", {
        status: session ? 'authenticated' : 'unauthenticated',
        user: session?.user
      });

      // First, check if we need to ask for an email
      if (!session?.user && !guestEmail) {
        console.log("User is not authenticated and no guest email provided");
        setShowEmailForm(true);
        return;
      }
      
      setIsProcessingCheckout(true);
      
      // Read cart from localStorage or use current cart items
      if (items.length === 0) {
        toast.error('Your cart is empty');
        setIsProcessingCheckout(false);
        return;
      }
      
      // Prepare the request payload
      const payload = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        // Only do guest checkout if not authenticated
        isGuestCheckout: !session?.user, 
        // Include email for all users to help with fallback identification
        userEmail: session?.user?.email || guestEmail || null
      };
      
      console.log("Sending order payload:", payload);
      
      const response = await fetch(API_ENDPOINTS.order, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Read the response as text first to help with debugging
      const responseText = await response.text();
      let responseData;
      
      try {
        // Try to parse as JSON
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        toast.error('Server returned an invalid response');
        setIsProcessingCheckout(false);
        return;
      }

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.details || 'Failed to create order';
        console.error('Order creation failed:', errorMessage);
        toast.error(errorMessage);
        setIsProcessingCheckout(false);
        return;
      }

      const { orderId: newOrderId } = responseData;
      setOrderId(newOrderId);
      console.log('Order created successfully:', newOrderId);

      // Step 2: Fetch payment gateways
      await fetchPaymentGateways();
      
      // Show the checkout sheet once everything is ready
      setShowCheckoutSheet(true);

    } catch (error) {
      console.error('Checkout error:', error);
      // Show a more specific error message if possible
      const errorMessage = error instanceof Error ? error.message : 'Failed to proceed to checkout';
      toast.error(errorMessage);
      setIsProcessingCheckout(false);
    }
  };
  
  // Fetch IDs and final price for the order
  const fetchIdsAndFinalPrice = async (orderId: string): Promise<{ finalPrice: number; productIds: string[] }> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.order}/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order summary');
      }
      const data = await response.json();
      console.log('Fetched IDs and final price:', data);
  
      setTotalPayout(data.finalPrice);
      return {
        finalPrice: data.finalPrice,
        productIds: data.productIds,
      };
    } catch (error) {
      console.error('Error fetching IDs and final price:', error);
      throw error;
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    clearCart(); // Clear the cart after successful payment
    setShowCheckoutSheet(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to get started!</p>
          <Link href="/products">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            {items.map((item) => (
              <div key={item.id} className="p-4 border-b last:border-b-0">
                <div className="flex items-start gap-4">
                  {/* Item Image Placeholder */}
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                    {item.isPackage ? (
                      <Package className="h-8 w-8 text-gray-400" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.isPackage && (
                        <button 
                          onClick={() => togglePackage(item.id)}
                          className="p-0.5 hover:bg-gray-100 rounded"
                        >
                          {expandedPackages.includes(item.id) 
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                          }
                        </button>
                      )}
                      <h3 className="font-medium">{item.title}</h3>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Qty:</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <div className="text-lg font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 ml-auto"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Package Items */}
                    {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
                      <div className="mt-4 ml-4 space-y-2">
                        <p className="font-medium text-sm text-gray-500">Package Items:</p>
                        {item.packageItems.map((packageItem, index) => (
                          <div key={index} className="flex justify-between text-sm text-gray-600 border-t pt-2">
                            <span>{packageItem.title}</span>
                            <span>${packageItem.price.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="text-sm text-green-600 font-medium border-t pt-2">
                          15% Package Savings Applied
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({totalItems}):</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full text-lg py-6" 
              size="lg"
              onClick={() => handleProceedToPayment()}
              disabled={isProcessingCheckout}
            >
              {isProcessingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Proceed to Checkout</>
              )}
            </Button>
            
            <div className="mt-4">
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
            
            {/* Payment gateway checkout sheet */}
            <Sheet 
              open={showCheckoutSheet} 
              onOpenChange={(open) => setShowCheckoutSheet(open)}
            >
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>
                    {!session?.user && showEmailForm ? 'Enter Your Email' : 'Select Payment Method'}
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6">
                  {!session?.user && showEmailForm ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className={emailError ? "border-red-500" : ""}
                        />
                        {emailError && (
                          <p className="text-sm text-red-500">{emailError}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full">
                        Continue to Payment
                      </Button>
                    </form>
                  ) : isProcessingCheckout ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : paymentGateways.length === 0 ? (
                    <p className="text-center text-gray-500">No payment methods available</p>
                  ) : (
                    <div className="space-y-4">
                      {paymentGateways.map((gateway) => (
                        <div 
                          key={gateway.id}
                          className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{gateway.name}</h3>

                              {gateway.isActive && gateway.name === 'PAYPAL' && paypalOptions.clientId && (
                                <div className="mt-2">
                                  <div className="flex flex-col items-center gap-4">
                                    <h1 className="text-xl font-semibold">PayPal Checkout</h1>
                                    <PayPalButtonWrapper 
                                      clientId={paypalOptions.clientId}
                                      onLoad={() => setPaypalMainLoaded(true)}
                                    />
                                  </div>
                                </div>
                              )}
                                
                              {gateway.isActive && gateway.name === 'STRIPE' && (
                               <div className="flex flex-col items-center gap-4">
                                 <h1 className="text-xl font-semibold">Stripe Checkout</h1>
                                 <button
                                   onClick={() => {
                                     console.log('Stripe publishable key available:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
                                     handleStripeCheckout();
                                   }}
                                   disabled={isProcessingCheckout}
                                   className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out disabled:opacity-50"
                                 >
                                   {isProcessingCheckout ? 'Processing...' : 'Pay with Stripe'}
                                 </button>
                               </div>
                              )}
                              
                              {gateway.businessName && (
                                <p className="text-sm text-gray-500">
                                  Powered by {gateway.businessName}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-sm">
                              {gateway.environment === 'test' && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  Test Mode
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-500 flex gap-2">
                            {gateway.supportsCreditCards && (
                              <span className="bg-gray-100 px-2 py-1 rounded">Credit Card</span>
                            )}
                            {gateway.supportsDirectDebit && (
                              <span className="bg-gray-100 px-2 py-1 rounded">Direct Debit</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}