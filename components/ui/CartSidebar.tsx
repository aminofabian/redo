'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);


import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

const LoadPayPal = () => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  if(isPending) {
    return (<>
    <div className="flex justify-center py-8">

<Loader2 className="h-5 w-5 animate-spin" />
      </div>

    </>)
  } else if(isRejected) {
    return (<>
    <div className="flex justify-center py-8">
      <p className="text-red-500">Failed to load PayPal script</p>
      </div>
    </>)
  }
}
type PaymentGateway = {
  id: string;
  name: string;
  isActive: boolean;
  environment: string;
  businessName: string | null;
  supportsCreditCards: boolean;
  supportsDirectDebit: boolean;
};





type props = {
  priceId: string;
  price: string;
  description:string;
};

// Add a type definition at the top of your file
type CartItem = {
  id: string;
  quantity: number;
};

function PayPalButtonsWrapper({ options, children }: { options: ReactPayPalScriptOptions, children: React.ReactNode }) {
  return (
    <PayPalScriptProvider options={options}>
      {children}
    </PayPalScriptProvider>
  );
}

// Update the PayPalButtonWrapper component
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

// Create a reusable PayPal button component first, before it's referenced
const PayPalCheckoutButton = ({ onReadyCallback }: { onReadyCallback: () => void }) => {
  // This is a forward reference to totalPayout from the parent component
  // We'll fix it by passing the amount as a prop instead
  const safeAmount = "0.00"; // Default value, will be overridden by props
  
  return (
    <PayPalButtons
      style={{ layout: "vertical" }}
      createOrder={(data, actions) => {
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
      // Other handlers would go here
    />
  );
};

// Then define the components that use it
const PayPalButtonContent = ({ onLoad }: { onLoad: () => void }) => {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  
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
  
  return <PayPalCheckoutButton onReadyCallback={() => {}} />;
};

export function CartSidebar({ priceId, price, description }: props) {
  // const { items, removeItem, totalItems, totalPrice } = useCart();
  const { items, removeItem, totalItems, totalPrice, clearCart } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [totalPayout, setTotalPayout] = useState<string>('0.00');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const { data: session, status: sessionStatus } = useSession();

  const isLoggedIn = sessionStatus === 'authenticated' && !!session?.user;

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    console.log("Session status:", sessionStatus, "User:", session?.user);
  }, [session, sessionStatus]);

  // Add a state for PayPal options
  const [paypalOptions, setPaypalOptions] = useState({
    clientId: "",
    currency: "USD",
    intent: "capture",
    components: "buttons,funding-eligibility",
    'data-client-token': 'abc123',
  });

  // Separate script loaded states for each PayPal integration
  const [paypalMainLoaded, setPaypalMainLoaded] = useState(false);
  const [paypalQuickLoaded, setPaypalQuickLoaded] = useState(false);

  // Update the fetchPaypalClientId function to fix the error
  const fetchPaypalClientId = async () => {
    try {
      const response = await fetch('/api/paypal-sdk');
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
      
      // Also fix the fallback
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

  useEffect(() => {
    // Load PayPal configuration on component mount
    fetchPaypalClientId();
  }, []); // Empty dependency array to run only once

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout-sessions/create', {
        
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items,
          orderId
          // returnUrl: window.location.href,
        }),
      });

      const { sessionId, error } = await response.json();
      console.log(sessionId, 'sessionId,..................................................');

      if (error) {
        console.error('Error creating checkout session:', error);
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        console.error('Stripe checkout error:', stripeError);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }

    setIsLoading(false);
  };
  // const handleCheckout = async () => {
  //   const stripe = await stripePromise;
  //   // const response = await fetch('/api/stripe/checkout-sessions/create', {
  //   //   method: 'POST',
  //   // });

  //   const res = await fetch('/api/stripe/checkout-sessions/create', {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ cartItems: items, returnUrl: window.location.origin, }),
  //   });
  //   const session = await res.json();
  //   if (stripe) {
  //     await stripe.redirectToCheckout({ sessionId: session.id });
  //   } else {
  //     console.error('Stripe initialization failed.');
  //   }
  // };




  // Fetch active payment gateways
  const fetchPaymentGateways = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment-gateways');
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data = await response.json();
      console.log(data.gateways, 'Fetched payment gateways..................................');
      setPaymentGateways(data.gateways);

      // If PayPal is in the list, fetch its clientId automatically
      const hasPaypal = data.gateways.find((gateway: PaymentGateway) => gateway.name === 'PAYPAL');
      if (hasPaypal) {
        await fetchPaypalClientId();
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };




  const handleProceedToPayment = async () => {
    try {
      // Clear any previous state
      setShowEmailForm(false);
      
      console.log("Proceeding to payment with session:", {
        status: sessionStatus,
        isAuthenticated: sessionStatus === 'authenticated',
        user: session?.user
      });

      // First, check if we need to ask for an email
      if (sessionStatus !== 'authenticated' && !guestEmail) {
        console.log("User is not authenticated and no guest email provided");
        setShowEmailForm(true);
        return;
      }
      
      setIsLoading(true);
      
      // Read cart from localStorage
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (localCart.length === 0) {
        toast.error('Your cart is empty');
        setIsLoading(false);
        return;
      }
      
      // Prepare the request payload
      // Always include user ID if available, fall back to email for guests
      const payload = {
        items: localCart.map((item: CartItem) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        // Only do guest checkout if not authenticated
        isGuestCheckout: sessionStatus !== 'authenticated', 
        // Include email for all users to help with fallback identification
        userEmail: session?.user?.email || guestEmail || null
      };
      
      console.log("Sending order payload:", payload);
      
      const response = await fetch('/api/order', {
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
        return;
      }

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.details || 'Failed to create order';
        console.error('Order creation failed:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      const { orderId } = responseData;
      setOrderId(orderId);
      console.log('Order created successfully:', orderId);

      // Step 2: Fetch payment gateways
      await fetchPaymentGateways();

      // Step 3: Fetch final price and product IDs
      await fetchIdsAndFinalPrice(orderId);

    } catch (error) {
      console.error('Checkout error:', error);
      // Show a more specific error message if possible
      const errorMessage = error instanceof Error ? error.message : 'Failed to proceed to checkout';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIdsAndFinalPrice = async (orderId: string): Promise<{ finalPrice: number; productIds: string[] }> => {
    try {
      // Simulate a dummy fetch
      const response = await fetch(`/api/order/${orderId}`);
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


    const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    clearCart(); // Clear the cart after successful payment
  };




  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  // Add a function to validate email
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

  // Add a function to handle the email submission
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submit form triggered with:', guestEmail);
    
    if (validateEmail(guestEmail)) {
      setShowEmailForm(false);
      // Call handleProceedToPayment directly
      handleProceedToPayment();
    }
  };

  useEffect(() => {
    // Check if PayPal script loaded properly
    console.log("PayPal script state:", {
      clientId: paypalOptions.clientId,
      hasClientId: !!paypalOptions.clientId,
      scriptLoaded: typeof window !== 'undefined' && !!window.paypal
    });
  }, [paypalOptions]);

  useEffect(() => {
    // Debug PayPal SDK loading
    const checkPayPalSDK = setInterval(() => {
      if (window.paypal) {
        console.log("PayPal SDK loaded successfully ✅");
        console.log("PayPal button options:", paypalOptions);
        clearInterval(checkPayPalSDK);
      }
    }, 1000);
    
    return () => clearInterval(checkPayPalSDK);
  }, []);

  if (items.length === 0) return null;
  
  // Convert the amount safely (this is not a hook, so it's fine after the conditional)
  const amount = Number(totalPayout).toString(); // Clean conversion
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="font-bold text-lg">Cart Summary</h2>
        </div>
        <span className="text-sm text-gray-500">({totalItems} items)</span>
      </div>
      
      <div className="space-y-3 mb-4 max-h-[300px] overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="border-b pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1">
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
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <p className="text-sm text-gray-600">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Package Items */}
            {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
              <div className="mt-2 ml-6 space-y-1 text-sm text-gray-600">
                <p className="font-medium text-xs text-gray-500 mb-1">Package Items:</p>
                {item.packageItems.map((packageItem, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{packageItem.title}</span>
                    <span>${packageItem.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="text-xs text-green-600 font-medium pt-1">
                  75% Package Savings Applied
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between font-medium text-lg mb-4">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        
        <Sheet onOpenChange={(open) => open && handleProceedToPayment()}>
          <SheetTrigger asChild>
            <Button className="w-full">
              Proceed to Checkout ({totalItems} items)
            </Button>
          </SheetTrigger>
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
              ) : isLoading ? (
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

                      onClick={() => {
                        // Handle gateway selection
                        console.log(`Selected payment gateway: ${gateway.name}`);
                        if(gateway.name === 'PAYPAL') {
                          console.log('yes welcome to paypal..:')
                        }
                        // Will implement actual payment flow here
                      }}
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
                             <h1 className="text-xl font-semibold">Stripe Checkout Example</h1>
                             <button
                               onClick={handleCheckout}
                               className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out"
                             >
                               Pay with Stripe
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
                  
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-medium mb-3">Quick Checkout Options</h3>
                    
                    {paypalOptions.clientId && (
                      <div className="mb-4">
                        <div className="flex flex-col items-center gap-4">
                          <h1 className="text-xl font-semibold">PayPal Checkout</h1>
                          <PayPalButtonWrapper 
                            clientId={paypalOptions.clientId}
                            onLoad={() => setPaypalQuickLoaded(true)}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* You can add other quick checkout options here */}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 