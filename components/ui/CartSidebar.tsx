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

// Define package type
type Package = {
  size: number | null;
  items: CartItem[];
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

// Price calculation component
const PriceCalculation = ({ currentPackage }: { currentPackage: Package }) => (
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
);

// Package items display component
const PackageItems = ({ currentPackage }: { currentPackage: Package }) => (
  <div className="mt-3 space-y-1 border-t border-green-200 pt-2">
    {currentPackage.items && currentPackage.items.length > 0 ? (
      <>
        <p className="text-xs font-semibold text-green-700">Items in your package ({currentPackage.items.length}):</p>
        <div className="flex flex-wrap gap-2">
          {currentPackage.items.map((item, idx) => (
            <span key={idx} className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-800">
              {item.title.length > 20 ? `${item.title.substring(0, 20)}...` : item.title}
            </span>
          ))}
        </div>
      </>
    ) : (
      <>
        <p className="text-xs text-amber-600">No items added to package yet</p>
        <p className="text-xs text-gray-600">Add items to complete your package deal</p>
      </>
    )}
  </div>
);

// Create reusable components for package display
const PackageDisplay = ({ currentPackage }: { currentPackage: Package }) => {
  if (!currentPackage || currentPackage.size === null) return null;
  
  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md mb-4">
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
      
      <ProgressBar currentPackage={currentPackage} />
      <PackageStatus currentPackage={currentPackage} />
      <PriceCalculation currentPackage={currentPackage} />
      <PackageItems currentPackage={currentPackage} />
    </div>
  );
};

// Other helper components
const ProgressBar = ({ currentPackage }: { currentPackage: Package }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-green-600 h-2.5 rounded-full"
      style={{ width: `${(currentPackage.items.length / (currentPackage.size || 1)) * 100}%` }}
    ></div>
  </div>
);

const PackageStatus = ({ currentPackage }: { currentPackage: Package }) => (
  <p className="mt-2 text-sm text-green-700">
    {currentPackage.size && currentPackage.size - currentPackage.items.length === 0
      ? "Package complete! Ready for checkout."
      : `${currentPackage.size ? currentPackage.size - currentPackage.items.length : 0} more ${
          currentPackage.size && currentPackage.size - currentPackage.items.length === 1 ? 'item' : 'items'
        } needed`}
  </p>
);

// Use these components in your main component
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

  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

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
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const response = await axios.post('/api/create-checkout-session', {
        items, 
        // Pass the discounted price for checkout
        totalAmount: calculateFinalPrice(),
        email: guestEmail || session?.user?.email,
        // Include package discount info
        hasPackageDiscount: !!(currentPackage?.items?.length > 0),
        packageSavings: currentPackage?.items?.length > 0 ? 
          calculateSavings(currentPackage.items) : '0.00'
      });
      
      // Rest of the function...
    } catch (error) {
      // Error handling...
    }
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
    setIsProcessingCheckout(true);
    
    try {
      // Show email form for guests
      if (!session?.user) {
        setShowEmailForm(true);
        setShowCheckoutSheet(true);
        setIsProcessingCheckout(false);
        return;
      }

      // Fetch payment gateways
      const response = await fetch('/api/payment-gateways');
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data = await response.json();
      setPaymentGateways(data.gateways);

      // Create an order with properly formatted product IDs
      const orderResponse = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity || 1,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
          })),
          totalPrice: parseFloat(calculateFinalPrice())
        })
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const orderData = await orderResponse.json();
      setOrderId(orderData.id);
      localStorage.setItem('orderId', orderData.id);

      // Pre-fetch PayPal configuration if PayPal is available
      const hasPaypal = data.gateways.find((gateway: PaymentGateway) => gateway.name === 'PAYPAL');
      if (hasPaypal) {
        await fetchPaypalClientId();
      }

      // Open checkout sheet
      setShowCheckoutSheet(true);
    } catch (error) {
      console.error('Error in checkout process:', error);
      toast.error('Failed to initialize checkout. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!guestEmail || !guestEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setShowEmailForm(false);
    setIsProcessingCheckout(true);
    
    try {
      // Create guest user session or store email
      await fetch('/api/guest-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: guestEmail })
      });
      
      // Continue with checkout process - fetch payment methods
      await fetchPaymentGateways();
    } catch (error) {
      console.error('Error creating guest checkout:', error);
      toast.error('Something went wrong. Please try again.');
      setShowEmailForm(true);
    } finally {
      setIsProcessingCheckout(false);
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
  
  // Enhanced final price calculation with detailed logging
  const calculateFinalPrice = () => {
    if (!currentPackage?.items?.length) {
      return totalPrice.toFixed(2);
    }

    // Create a Set of IDs from the package items for quick lookup
    const packageItemIds = new Set(currentPackage.items.map(item => 
      item.id?.toString()
    ));
    
    // Calculate totals for regular items and package items
    let packageItemsTotal = 0;
    let regularItemsTotal = 0;
    
    // Go through cart items and separate package items from regular items
    items.forEach(item => {
      const itemPrice = typeof item.price === 'string' 
        ? parseFloat(item.price) 
        : (item.price || 0);
      
      if (packageItemIds.has(item.id?.toString())) {
        // This is a package item - apply 75% discount (only pay 25%)
        packageItemsTotal += itemPrice;
      } else {
        // Regular item - full price
        regularItemsTotal += itemPrice;
      }
    });
    
    // Apply 75% discount to package items
    const discountedPackageTotal = packageItemsTotal * 0.25;
    
    // Final price is regular items + discounted package items
    const finalPrice = regularItemsTotal + discountedPackageTotal;
    
    // Logging to debug calculations
    console.log({
      regularItems: regularItemsTotal.toFixed(2),
      packageItems: packageItemsTotal.toFixed(2),
      discountedPackage: discountedPackageTotal.toFixed(2),
      finalTotal: finalPrice.toFixed(2)
    });
    
    return finalPrice.toFixed(2);
  };

  const handleBundleOnlyCheckout = () => {
    console.log("Checking out bundle only");
    // Create a checkout that only includes bundle items
    const bundleItems = currentPackage?.items || [];
    const bundleTotal = parseFloat(calculateDiscountedPrice(bundleItems));
    
    // Proceed with checkout using only bundle items
    handleCheckoutWithItems(bundleItems, bundleTotal, true);
  };

  const handleRegularItemsCheckout = () => {
    console.log("Checking out regular items only");
    // Filter out package items from the cart by exact ID comparison
    const regularItems = items.filter(item => {
      // Check if this cart item ID exists in any package items
      return !currentPackage?.items?.some(
        packageItem => packageItem.id?.toString() === item.id?.toString()
      );
    });
    
    const regularTotal = regularItems.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + price;
    }, 0);
    
    // Proceed with checkout using only regular items
    handleCheckoutWithItems(regularItems, regularTotal, false);
  };

  // Base checkout function that handles different item selections
  const handleCheckoutWithItems = (
    checkoutItems: CartItem[],
    total: number,
    isBundle: boolean
  ) => {
    // Store the selected items in session/local storage or state
    sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));
    sessionStorage.setItem('checkoutTotal', total.toString());
    sessionStorage.setItem('isBundle', isBundle.toString());
    
    // Now continue with your existing checkout flow
    handleProceedToPayment();
  };
  
  const handleStripeCheckout = async () => {
    try {
      setIsProcessingCheckout(true);
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }
      
      // Assume session ID is available from earlier API call
      const sessionId = localStorage.getItem('stripeSessionId');
      if (!sessionId) {
        throw new Error('Stripe session ID not found');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error in Stripe checkout:', error);
      toast.error('Failed to initialize Stripe checkout. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <>
      {items.length === 0 && !currentPackage && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Product Details</h3>
          <div className="text-sm text-gray-600">
            <p className="mb-2">{description}</p>
            <div className="flex flex-col">
              <span className="font-medium">Price</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">${price}</span>
                {/* Any discount display */}
              </div>
            </div>
          </div>
        </div>
      )}

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
        {/* Package display - only rendered once */}
        <PackageDisplay currentPackage={currentPackage} />
        
        {/* Regular Cart Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-bold text-lg">Cart Summary</h2>
          </div>
          <span className="text-sm text-gray-500">({totalItems} items)</span>
        </div>
        
        {/* Cart Items Display - Show both regular items and package items */}
        <div className="space-y-3 mb-4 max-h-[300px] overflow-auto">
          {/* First show regular cart items */}
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
          
          {/* Then show a special section for package items if they're not already in the cart */}
          {currentPackage && currentPackage.items && currentPackage.items.length > 0 && (
            <div className="mt-4 border-t border-green-200 pt-3">
              <div className="flex items-center mb-2">
                <Package className="h-4 w-4 mr-1 text-green-600" />
                <span className="font-medium text-green-800">Package Items</span>
              </div>
              
              {currentPackage.items.map((item, idx) => (
                <div key={`package-${item.id || idx}`} className="flex justify-between items-center py-1 border-b border-gray-100">
                  <div>
                    <p className="text-sm">{item.title}</p>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 line-through mr-1">${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}</span>
                      <span className="text-xs text-green-600 font-medium">
                        ${typeof item.price === 'string' 
                          ? (parseFloat(item.price) * 0.25).toFixed(2) 
                          : (item.price * 0.25).toFixed(2)} (75% off)
                      </span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Bundle item</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Package Summary Section - Clearly separated */}
      {currentPackage && currentPackage.items && currentPackage.items.length > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-green-800 flex items-center">
              <Package className="h-4 w-4 mr-1" />
              Bundle Summary
            </h3>
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded-md text-xs font-bold">
              75% OFF
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            {currentPackage.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.title}</span>
                <div>
                  <span className="text-gray-500 line-through mr-2">
                    ${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}
                  </span>
                  <span className="text-green-700 font-medium">
                    ${typeof item.price === 'string' 
                      ? (parseFloat(item.price) * 0.25).toFixed(2) 
                      : (item.price * 0.25).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-green-200 pt-3 mb-3">
            <div className="flex justify-between font-medium">
              <span>Bundle Total:</span>
              <span className="text-green-700">
                ${calculateDiscountedPrice(currentPackage.items)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>You save:</span>
              <span>${calculateSavings(currentPackage.items)}</span>
            </div>
          </div>
          
          {/* Bundle-only checkout button */}
          <Button 
            onClick={() => handleBundleOnlyCheckout()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Checkout Bundle Only
          </Button>
        </div>
      )}

      {/* Checkout Options Section */}
      <div className="border-t pt-4 mt-2">
        <div className="space-y-3">
          {/* Regular items summary if any exist */}
          {items.length > 0 && (
            <div className="flex justify-between font-medium">
              <span>Regular Items:</span>
              <span>${items.reduce((sum, item) => {
                // Check if this item exists in the package by ID
                const isInPackage = currentPackage?.items?.some(
                  packageItem => packageItem.id?.toString() === item.id?.toString()
                );
                
                // If item is in package, don't count it here since it will be counted in the package
                if (isInPackage) {
                  return sum;
                }
                
                // Only add non-package items
                const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                return sum + price;
              }, 0).toFixed(2)}</span>
            </div>
          )}
          
          {/* Complete total (with package discount applied) */}
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-lg">Total:</span>
            <span className="text-xl font-bold">
              ${calculateFinalPrice()}
            </span>
          </div>
          
          {/* Checkout buttons */}
          <div className="grid grid-cols-1 gap-3 mt-4">
            {/* Complete cart checkout button */}
            <Button 
              onClick={() => handleProceedToPayment()}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-900"
            >
              Checkout Everything (${calculateFinalPrice()})
            </Button>
            
            {/* Regular items only button - only show if there are non-package items */}
            {items.some(item => !currentPackage?.items.some(pkg => pkg.id === item.id)) && (
              <Button 
                onClick={() => handleRegularItemsCheckout()}
                variant="outline" 
                className="w-full"
              >
                Checkout Regular Items Only
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add this checkout sheet just before the closing fragment */}
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
                <Loader2 className="h-8 w-8 animate-spin" />
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
                             onClick={handleStripeCheckout}
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
    </>
  );
} 