'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight, Loader2, Package } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';

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
import { safeJsonStringify } from '@/lib/json';

const stripePromise = (() => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('Missing Stripe publishable key in environment variables');
    return null;
  }
  return loadStripe(key);
})();

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

// Add a type for the cart items
type CartItem = {
  id: string | number;
  price: string | number;
  title: string;
  quantity: number;
  // other properties as needed
};

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
      
          const currentOrderId = localStorage.getItem('orderId');
          if (!currentOrderId) {
            console.error("Order ID is not available");
            toast.error("Order ID not found. Please try again.");
            return;
          }
      
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
  const { totalPrice } = useCart(); 
  
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
  
  const formattedTotal = Number(totalPrice).toFixed(2);
  return <PayPalCheckoutButton onReadyCallback={() => {}} amount={formattedTotal} />;
};

function replaceBigInt(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// Update the helper functions with type annotations
const calculatePackageTotal = (items: CartItem[]): string => {
  return items.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
    return sum + price;
  }, 0).toFixed(2);
};

const calculateDiscountedPrice = (items: CartItem[]): string => {
  const total = calculatePackageTotal(items);
  return (parseFloat(total) * 0.25).toFixed(2);
};

const calculateSavings = (items: CartItem[]): string => {
  const total = calculatePackageTotal(items);
  return (parseFloat(total) * 0.75).toFixed(2);
};

export function CartSidebar({ priceId, price, description }: props) {
  const { items, removeItem, totalItems, totalPrice, clearCart, currentPackage } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  localStorage.setItem('orderId', orderId || '');

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

  const [paypalOptions, setPaypalOptions] = useState({
    clientId: "",
    currency: "USD",
    intent: "capture",
    components: "buttons,funding-eligibility",
    'data-client-token': 'abc123',
  });

  const [paypalMainLoaded, setPaypalMainLoaded] = useState(false);
  const [paypalQuickLoaded, setPaypalQuickLoaded] = useState(false);

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
    fetchPaypalClientId();
  }, []); 

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      console.log("Initializing checkout with Stripe");
      
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
        setIsLoading(false);
        return;
      }

      const { sessionId } = await response.json();
      console.log('Created session ID:', sessionId);
      
      const stripe = await stripePromise;
      if (!stripe) {
        console.error('Could not load Stripe');
        toast.error('Payment system unavailable');
        setIsLoading(false);
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

    setIsLoading(false);
  };

  const fetchPaymentGateways = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment-gateways');
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data = await response.json();
      console.log(data.gateways, 'Fetched payment gateways..................................');
      setPaymentGateways(data.gateways);

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

  const fetchIdsAndFinalPrice = async (orderId: string): Promise<{ finalPrice: number; productIds: string[] }> => {
    try {
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
    clearCart(); 
  };

  const handleProceedToPayment = async () => {
    try {
      setShowEmailForm(false);
      
      console.log("Proceeding to payment with session:", {
        status: sessionStatus,
        isAuthenticated: sessionStatus === 'authenticated',
        user: session?.user
      });

      if (sessionStatus !== 'authenticated' && !guestEmail) {
        console.log("User is not authenticated and no guest email provided");
        setShowEmailForm(true);
        return;
      }
      
      setIsLoading(true);
      
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (localCart.length === 0) {
        toast.error('Your cart is empty');
        setIsLoading(false);
        return;
      }
      
      const payload = {
        items: localCart.map((item: CartItem) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        isGuestCheckout: sessionStatus !== 'authenticated', 
        userEmail: session?.user?.email || guestEmail || null
      };
      
      console.log("Sending order payload:", payload);
      
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      let responseData;
      
      try {
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

      await fetchPaymentGateways();

      await fetchIdsAndFinalPrice(orderId);

    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to proceed to checkout';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  const validateEmail = (email: string) => {
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
    
    setEmailError('');
    return true;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submit form triggered with:', guestEmail);
    
    if (validateEmail(guestEmail)) {
      setShowEmailForm(false);
      handleProceedToPayment();
    }
  };

  useEffect(() => {
    console.log("PayPal script state:", {
      clientId: paypalOptions.clientId,
      hasClientId: !!paypalOptions.clientId,
      scriptLoaded: typeof window !== 'undefined' && !!window.paypal
    });
  }, [paypalOptions]);

  useEffect(() => {
    const checkPayPalSDK = setInterval(() => {
      if (window.paypal) {
        console.log("PayPal SDK loaded successfully ");
        console.log("PayPal button options:", paypalOptions);
        clearInterval(checkPayPalSDK);
      }
    }, 1000);
    
    return () => clearInterval(checkPayPalSDK);
  }, []);

  useEffect(() => {
    console.log('Stripe key available on client:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      console.log('Stripe key format valid:', key.startsWith('pk_'));
    }
  }, []);

  useEffect(() => {
    console.log("Package info:", {
      hasPackage: !!currentPackage,
      packageSize: currentPackage?.size,
      itemsCount: currentPackage?.items?.length || 0
    });
  }, [currentPackage]);

  if (items.length === 0 && (!currentPackage || currentPackage.size === null)) return null;
  
  const amount = Number(totalPayout).toString(); 
  
  return (
    <>
      {items.length === 0 && currentPackage && (
        <div className="mt-3 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <Package className="h-10 w-10 mx-auto text-green-600 mb-2" />
          <h3 className="font-semibold text-green-800">Package Deal Selected!</h3>
          <p className="text-sm text-green-700 mb-3">
            You've started a {currentPackage.size}-item package with 75% off.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${(currentPackage.items.length / (currentPackage.size || 1)) * 100}%` }}
            />
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => router.push('/products')}
          >
            Browse Products to Complete Package
          </Button>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        {/* Package Builder Status - Show this first if there's an active package */}
        {currentPackage && currentPackage.size !== null && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-green-800 flex items-center">
                <Package className="h-4 w-4 mr-1 animate-pulse" />
                <span className="relative">
                  {currentPackage.size}-Item Package Deal
                  <span className="absolute -top-2 -right-12 transform rotate-12 bg-yellow-400 text-xs px-1 font-bold text-yellow-800 rounded">BEST VALUE!</span>
                </span>
              </h3>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded-md text-xs font-bold relative overflow-hidden">
                <span className="relative z-10">75% OFF</span>
                <span className="absolute inset-0 bg-green-300 animate-pulse-slow opacity-50"></span>
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${(currentPackage.items.length / (currentPackage.size || 1)) * 100}%` }}
              ></div>
            </div>
            
            <p className="mt-2 text-sm text-green-700">
              {currentPackage.size && currentPackage.size - currentPackage.items.length === 0 
                ? " Package complete! Ready for checkout." 
                : `${currentPackage.size ? currentPackage.size - currentPackage.items.length : 0} more ${currentPackage.size && currentPackage.size - currentPackage.items.length === 1 ? 'item' : 'items'} needed`}
            </p>
            
            {/* Add price calculation information */}
            <div className="mt-3 space-y-1 border-t border-green-200 pt-2">
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">${calculatePackageTotal(currentPackage.items || [])}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discounted Price:</span>
                <span className="font-medium text-green-700">${calculateDiscountedPrice(currentPackage.items || [])}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You Save:</span>
                <span className="font-medium text-green-800">${calculateSavings(currentPackage.items || [])}</span>
              </div>
            </div>
            
            {/* Package items list */}
            {currentPackage && currentPackage.items && currentPackage.items.length > 0 ? (
              <div className="mt-3 space-y-1 border-t border-green-200 pt-2">
                <p className="text-xs font-semibold text-green-700">Items in your package ({currentPackage.items.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {currentPackage.items.map((item, idx) => (
                    <span key={idx} className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-800">
                      {item.title.length > 20 ? `${item.title.substring(0, 20)}...` : item.title}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-1 border-t border-green-200 pt-2">
                <p className="text-xs text-amber-600">No items added to package yet</p>
                <p className="text-xs text-gray-600">Add items to complete your package deal</p>
              </div>
            )}
          </div>
        )}
        
        {/* Regular Cart Summary */}
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
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between font-medium text-lg mb-4">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        <div className="flex flex-col w-full gap-4">
          {/* Package Deal Status */}
          {currentPackage && currentPackage.size !== null && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-green-800">{currentPackage.size || 0}-Item Package Deal</h3>
                <span className="bg-green-200 text-green-800 px-2 py-1 rounded-md text-xs font-bold">
                  75% OFF
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${(currentPackage.items.length / (currentPackage.size || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-green-700">
                {currentPackage.size && currentPackage.size - currentPackage.items.length === 0
                  ? " Package complete! Ready for checkout."
                  : `${currentPackage.size ? currentPackage.size - currentPackage.items.length : 0} more ${currentPackage.size && currentPackage.size - currentPackage.items.length === 1 ? 'item' : 'items'} needed`}
              </p>

              {/* Add price calculation information */}
              <div className="mt-3 space-y-1 border-t border-green-200 pt-2">
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">${calculatePackageTotal(currentPackage.items || [])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discounted Price:</span>
                  <span className="font-medium text-green-700">${calculateDiscountedPrice(currentPackage.items || [])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You Save:</span>
                  <span className="font-medium text-green-800">${calculateSavings(currentPackage.items || [])}</span>
                </div>
              </div>

              {/* Package items list */}
              <div className="mt-3 space-y-1 border-t border-green-200 pt-2">
                <p className="text-xs font-semibold text-green-700">Items in your package:</p>
                <div className="flex flex-wrap gap-2">
                  {currentPackage.items.map((item, idx) => (
                    <span key={idx} className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-800">
                      {item.title.length > 20 ? `${item.title.substring(0, 20)}...` : item.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative bg-white hover:bg-gray-100">
                  <ShoppingBag className="h-5 w-5" />
                  {items.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {items.length}
                    </div>
                  )}
                  {currentPackage && currentPackage.size !== null && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-1 text-center">
                      Package: {currentPackage.items.length}/{currentPackage.size}
                    </div>
                  )}
                </Button>
              </SheetTrigger>
            </Sheet>
          </div>
        </div>

        <Sheet onOpenChange={(open) => open && handleProceedToPayment()}>
          <SheetTrigger asChild>
            <Button className="w-full">
              Proceed to Checkout ({items.length} items)
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
                        console.log(`Selected payment gateway: ${gateway.name}`);
                        if (gateway.name === 'PAYPAL') {
                          console.log('yes welcome to paypal..:');
                        }
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
                             <h1 className="text-xl font-semibold">Stripe Checkout</h1>
                             <button
                               onClick={() => {
                                 console.log('Stripe publishable key available:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
                                 handleCheckout();
                               }}
                               disabled={isLoading}
                               className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out disabled:opacity-50"
                             >
                               {isLoading ? 'Processing...' : 'Pay with Stripe'}
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
    </>
  );
} 