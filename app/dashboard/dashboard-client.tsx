"use client";

import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';
import { toast } from "react-hot-toast";
import { safeJsonStringify } from '@/lib/json';
import { 
  Download, 
  BookOpen, 
  Star, 
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  BookMarked,
  Bell,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Sparkles,
  Zap,
  Rocket,
  LogOut,
  Trash2,
  ArrowRight,
  Check,
  Search,
  Calendar,
  Gift,
  CreditCard,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "next-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/CartContext";

// Interfaces for all data types
interface OrderStats {
  totalOrders: number;
  unpaidOrders: number;
  completedOrders: number;
  totalSpent: number;
  coursesInCart: number;
}

interface DashboardStat {
  id: number;
  title: string;
  value: number;
  icon: any;
  trend: string;
  color: string;
}

interface Material {
  id: string;
  title: string;
  type: string;
  image: string | null;
  date: string;
  progress: number;
  productId: number;
  downloadExpiryDays?: number; // Optional field for download expiry (days from purchase)
  downloadUrl?: string; // URL to download the material
  product?: {
    downloadUrl?: string; // Download URL from the related product
    fileType?: string; // Type of the file
    fileSize?: string; // Size of the file
  };
  // For tracking loading state
  isLoadingDownloadUrl?: boolean;
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  rating: number;
  students: number;
  price: number;
  image: string;
  tag: string;
  icon?: React.ElementType;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

// API endpoints for the dashboard
const API_ENDPOINTS = {
  orderStats: '/api/order/count',
  dashboardStats: '/api/dashboard/stats',
  materials: '/api/dashboard/materials',
  recommendations: '/api/dashboard/recommendations',
  notifications: '/api/dashboard/notifications',
  quickActions: '/api/dashboard/quick-actions',
  paymentGateways: '/api/payment-gateways',
  paypalSdk: '/api/paypal-sdk',
  order: '/api/order'
} as const;

// Initialize Stripe
const stripePromise = (() => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('Missing Stripe publishable key in environment variables');
    return null;
  }
  return loadStripe(key);
})();

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

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};


const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export default function DashboardClient({ session }: { session: Session }) {
  // Function to map action names to icon components
  const getIconForAction = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'ShoppingCart': ShoppingCart,
      'FileText': FileText,
      'BookMarked': BookMarked,
      'Download': Download,
      'BookOpen': BookOpen,
      'CheckCircle': CheckCircle,
      'Clock': Clock,
      'Star': Star,
      'Sparkles': Sparkles,
      'Zap': Zap,
      'Rocket': Rocket,
      'Calendar': Calendar,
      'Gift': Gift,
      'Search': Search
    };
    
    return iconMap[iconName] || FileText; // Fallback to FileText if icon not found
  };
  
  // Function to fetch product download URL for a material
  const fetchProductDownloadUrl = async (material: Material) => {
    if (!material.productId) return;
    
    // Update the material to show loading state
    setPurchasedMaterials(prev => 
      prev.map(m => m.id === material.id ? { ...m, isLoadingDownloadUrl: true } : m)
    );
    
    try {
      // Fetch the product details to get the download URL
      const response = await fetch(`/api/products/${material.productId}`);
      if (!response.ok) throw new Error('Failed to fetch product details');
      
      const productData = await response.json();
      console.log('Fetched product data:', productData);
      
      // Update the material with the download URL
      setPurchasedMaterials(prev => 
        prev.map(m => m.id === material.id ? { 
          ...m, 
          isLoadingDownloadUrl: false,
          downloadUrl: productData.downloadUrl,
          product: {
            downloadUrl: productData.downloadUrl,
            fileType: productData.fileType,
            fileSize: productData.fileSize
          }
        } : m)
      );
    } catch (error) {
      console.error('Error fetching product download URL:', error);
      // Clear loading state on error
      setPurchasedMaterials(prev => 
        prev.map(m => m.id === material.id ? { ...m, isLoadingDownloadUrl: false } : m)
      );
    }
  };
  
  // State for order statistics
  const [orderStats, setOrderStats] = useState<OrderStats | null>({
    totalOrders: 18,
    unpaidOrders: 2,
    completedOrders: 16,
    totalSpent: 1249.95,
    coursesInCart: 3
  });
  // State for dashboard statistics
  const [dashboardStats, setDashboardStats] = useState<DashboardStat[]>([]);
  // State for purchased materials
  const [purchasedMaterials, setPurchasedMaterials] = useState<Material[]>([]);
  // State for recommended resources
  const [recommendedResources, setRecommendedResources] = useState<Recommendation[]>([]);
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // State for quick actions
  const [quickActions, setQuickActions] = useState<Array<{
    icon: any;
    label: string;
    href: string;
    color: string;
  }>>([]);
  
  // Cart state through context
  const { items: cartItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const [showCartSection, setShowCartSection] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  
  // State for purchase success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Payment gateway states
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
  const [paypalQuickLoaded, setPaypalQuickLoaded] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [totalPayout, setTotalPayout] = useState<string>('0.00');
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  
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
          cartItems: cartItems,
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
      if (cartItems.length === 0) {
        toast.error('Your cart is empty');
        setIsProcessingCheckout(false);
        return;
      }
      
      // Prepare the request payload
      const payload = {
        items: cartItems.map((item) => ({
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
    setShowSuccessMessage(true);
      
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };
  
  // Handle the checkout completion (for modal approach)
  const handleCompleteCheckout = () => {
    setIsProcessingCheckout(true);
    
    // Instead of simulating, use the actual payment flow
    handleProceedToPayment();
  };
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Define a properly typed interface for our endpoints
        type EndpointConfig<T> = {
          url: string;
          stateHandler: React.Dispatch<React.SetStateAction<T>>;
          processor: (data: any) => T;
        };

        // Define the required endpoints with proper typing but no fallbacks
        const endpoints: EndpointConfig<any>[] = [
          { 
            url: API_ENDPOINTS.orderStats, 
            stateHandler: setOrderStats as React.Dispatch<React.SetStateAction<OrderStats>>, 
            processor: (data: any) => {
              if (!data) {
                console.error('Invalid order stats data received');
                return null;
              }
              return data as OrderStats;
            }
          },
          { 
            url: API_ENDPOINTS.dashboardStats, 
            stateHandler: setDashboardStats, 
            processor: (data: any) => transformDashboardStats(data) 
          },
          { 
            url: API_ENDPOINTS.materials, 
            stateHandler: setPurchasedMaterials, 
            processor: (data: any) => processMaterialsData(data) 
          },
          { 
            url: API_ENDPOINTS.recommendations, 
            stateHandler: setRecommendedResources, 
            processor: (data: any) => transformRecommendations(data) 
          },
          { 
            url: API_ENDPOINTS.notifications, 
            stateHandler: setNotifications, 
            processor: (data: any) => data as Notification[] 
          }
        ];

        // Create an object to collect all endpoint fetch promises
        const fetchPromises = endpoints.map(endpoint => {
          return fetch(endpoint.url)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${endpoint.url}: ${response.status} ${response.statusText}`);
              }
              return response.json();
            })
            .then(data => {
              console.log(`Data from ${endpoint.url}:`, data);
              // Process the data and update state
              const processedData = endpoint.processor(data);
              endpoint.stateHandler(processedData);
              return { endpoint: endpoint.url, success: true, data: processedData };
            })
            .catch(error => {
              console.error(`Error fetching ${endpoint.url}:`, error);
              // Don't use fallbacks, just set empty data
              if (endpoint.url.includes('orderStats')) {
                setOrderStats({ totalOrders: 0, unpaidOrders: 0, completedOrders: 0, totalSpent: 0, coursesInCart: 0 });
              } else if (endpoint.url.includes('dashboardStats')) {
                setDashboardStats([]);
              } else if (endpoint.url.includes('materials')) {
                setPurchasedMaterials([]);
              } else if (endpoint.url.includes('recommendations')) {
                setRecommendedResources([]);
              } else if (endpoint.url.includes('notifications')) {
                setNotifications([]);
              }
              return { endpoint: endpoint.url, success: false, error };
            });
        });

        // Execute all fetch promises in parallel
        const results = await Promise.all(fetchPromises);
        
        // Log any failed endpoints for troubleshooting
        const failedEndpoints = results.filter(result => !result.success);
        if (failedEndpoints.length > 0) {
          console.warn(`${failedEndpoints.length} endpoints failed to load:`, 
            failedEndpoints.map(f => f.endpoint).join(', '));
          console.log('Detailed errors:', failedEndpoints);
          
          // Check specific endpoints for critical errors that might need attention
          failedEndpoints.forEach(endpoint => {
            if (endpoint.endpoint.includes('materials')) {
              console.warn('Materials API endpoint failed - check API implementation');
            }
            if (endpoint.endpoint.includes('order/count')) {
              console.warn('Order stats API endpoint failed - check API implementation');
            }
          });
        }

        // Fetch quick actions from the API
        try {
          const quickActionsRes = await fetch(API_ENDPOINTS.quickActions);
          
          if (quickActionsRes.ok) {
            const quickActionsData = await quickActionsRes.json();
            
            if (Array.isArray(quickActionsData) && quickActionsData.length > 0) {
              const mappedQuickActions = quickActionsData.map(action => ({
                icon: getIconForAction(action.iconName),
                label: action.label || 'Action',
                href: action.href || '#',
                color: action.color || 'bg-blue-500'
              }));
              setQuickActions(mappedQuickActions);
            } else {
              // If the API returns empty data, still use defaults based on actual user needs
              console.log('Quick actions API returned empty data');
              setDefaultQuickActions();
            }
          } else {
            console.warn('Quick actions API failed, using user-relevant defaults');
            setDefaultQuickActions();
          }
        } catch (quickActionsErr) {
          console.error('Quick actions fetch error:', quickActionsErr);
          setDefaultQuickActions();
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    // Set default quick actions when API fails or returns empty data
    const setDefaultQuickActions = () => {
      setQuickActions([
        {
          icon: BookOpen,
          label: 'My Courses',
          href: '/courses',
          color: 'bg-blue-500'
        },
        {
          icon: FileText,
          label: 'Study Materials',
          href: '/materials',
          color: 'bg-green-500'
        },
        {
          icon: ShoppingCart,
          label: 'Browse Store',
          href: '/store',
          color: 'bg-purple-500'
        },
        {
          icon: Download,
          label: 'Downloads',
          href: '/downloads',
          color: 'bg-amber-500'
        }
      ]);
    };

    fetchAllData();
  }, []);

  // Safe number conversion helper function
  const ensureNumber = (value: any, defaultValue = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // Process materials data from the API
  const processMaterialsData = (data: any[]): Material[] => {
    if (!Array.isArray(data)) {
      console.error('Materials data is not an array:', data);
      return [];
    }

    return data.map(material => ({
      id: String(material.id || ''),
      title: material.title || 'Untitled Material',
      type: material.type || 'Course',
      image: material.image || '',
      date: material.date || new Date().toISOString().split('T')[0],
      progress: ensureNumber(material.progress, 0),
      productId: ensureNumber(material.productId, 0),
      downloadExpiryDays: material.daysUntilExpiry ? ensureNumber(material.daysUntilExpiry) : undefined,
      downloadUrl: material.downloadUrl || undefined,
      driveUrl: material.driveUrl || undefined,
      isDownloadAvailable: !!material.isDownloadAvailable,
      fileFormat: material.fileFormat || undefined,
      fileSize: material.fileSize || undefined,
      status: material.status || 'not_started'
    }));
  };

  // Transform dashboard stats data from API
  const transformDashboardStats = (data: any): DashboardStat[] => {
    // Handle the case when data is missing or invalid
    if (!data || !Array.isArray(data.stats)) {
      console.error('Dashboard stats data is invalid:', data);
      return [];
    }
    
    // Map icon names to actual icon components using the getIconForAction function
    return data.stats.map((stat: any) => ({
      id: stat.id,
      title: stat.title,
      value: stat.value,
      icon: getIconForAction(stat.iconName),
      trend: stat.trend || '',
      color: stat.color || 'bg-blue-500'
    }));
  };

  const transformRecommendations = (data: any): Recommendation[] => {
    // Ensure data is an array before attempting to map
    if (!data || !Array.isArray(data)) {
      console.error('Recommendations data is not an array:', data);
      return []; // Return empty array as fallback
    }
    
    return data.map(item => ({
      ...item,
      icon: getIconForTag(item.tag)
    }));
  };

  // Helper function to determine icon based on tag
  const getIconForTag = (tag: string) => {
    switch (tag) {
      case 'New':
        return Zap;
      case 'Bestseller':
        return Rocket;
      case 'Featured':
      case 'Popular':
      default:
        return Sparkles;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <StatsSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start shadow-sm"
        >
          <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error loading dashboard data</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-4"
            >
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                Try again
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  const firstName = (session?.user as any)?.firstName || session?.user?.name?.split(' ')[0] || 'Student';
  const hasUnreadNotifications = notifications.some(notification => !notification.read);
  
  // Using the getIconForAction function defined above

  // Determine if sections should be shown based on data
  const showMaterials = purchasedMaterials.length > 0;
  const showRecommendations = recommendedResources.length > 0;
  const hasCartItems = cartItems.length > 0;

  // Tab navigation configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookMarked },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartItems.length }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section - Modern gradient styling */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center border border-blue-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back, {firstName}!
            </h1>
            <p className="text-gray-500 mt-1">Ready to continue your learning journey today?</p>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="relative rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300"
                >
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl shadow-lg border border-blue-100">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-xl">
                  <DropdownMenuLabel className="font-semibold text-lg">Notifications</DropdownMenuLabel>
                  <p className="text-blue-100 text-sm">Stay updated with your progress</p>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className={cn(
                      "flex flex-col items-start p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50", 
                      !notification.read && "bg-blue-50"
                    )}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium flex items-center">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                          )}
                          {notification.title}
                        </span>
                        <span className="text-xs text-gray-400">{notification.time}</span>
                      </div>
                      <span className="text-sm text-gray-500 mt-1">{notification.message}</span>
                    </DropdownMenuItem>
                  )) : (
                    <div className="text-center py-6 text-gray-500">
                      <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-5 w-5 text-blue-400" />
                      </div>
                      <p>No notifications yet</p>
                      <p className="text-sm text-gray-400 mt-1">We'll notify you when something happens</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-b-xl text-center">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-full justify-center">
                      Mark all as read
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-blue-100 hover:border-blue-300 transition-colors">
                  <Avatar>
                    <AvatarImage src={(session?.user as any)?.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {firstName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 rounded-xl shadow-lg border border-blue-100">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white rounded-t-xl">
                  <DropdownMenuLabel className="font-normal text-xs text-blue-200">Signed in as</DropdownMenuLabel>
                  <p className="font-medium truncate">{(session?.user as any)?.email || session?.user?.name}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 px-3 mb-1 hover:bg-blue-50">
                    <Link href="/dashboard/profile" className="flex items-center">
                      <div className="bg-blue-100 p-1.5 rounded-full mr-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {firstName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 px-3 hover:bg-blue-50">
                    <Link href="/dashboard/billing" className="flex items-center">
                      <div className="bg-emerald-100 p-1.5 rounded-full mr-2">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Billing & Payments</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="my-1" />
                <div className="p-1">
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-lg py-2.5 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <div className="bg-red-100 p-1.5 rounded-full mr-2">
                      <LogOut className="h-4 w-4 text-red-600" />
                    </div>
                    <span>Log out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
        {/* Tab Navigation */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex overflow-x-auto sm:inline-flex mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "flex-1 sm:flex-initial rounded-lg px-4 py-2 relative whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Button>
          ))}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Stats Section can be uncommented and styled better if needed */}
            {/* <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookMarked className="h-5 w-5 mr-2 text-blue-600" />
                Learning Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardStats.map((stat, idx) => (
                  <motion.div
                    key={stat.id}
                    variants={cardVariants}
                    custom={idx}
                    className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                      </div>
                      <div className={cn("p-2 rounded-lg", stat.color)}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div> */}

            {/* Order Statistics */}
            {orderStats && (
              <motion.div 
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                  Your Order Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <motion.div 
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                    variants={cardVariants}
                    custom={0}
                  >
                    <h3 className="text-sm text-gray-500">Total Orders</h3>
                    <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] group relative"
                    onClick={() => setShowCheckoutModal(true)}
                    variants={cardVariants}
                    custom={1}
                  >
                    <div className="absolute top-2 right-2 bg-white text-blue-600 text-xs px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      <span>View</span>
                    </div>
                    <h3 className="text-sm text-blue-100 font-medium">Unpaid Orders</h3>
                    <p className="text-2xl font-bold">{orderStats.unpaidOrders}</p>
                    <div className="mt-2 text-xs text-blue-100 flex items-center">
                      <span>Click to checkout</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                    variants={cardVariants}
                    custom={2}
                  >
                    <h3 className="text-sm text-gray-500">Completed Orders</h3>
                    <p className="text-2xl font-bold">{ensureNumber(orderStats.completedOrders)}</p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                    variants={cardVariants}
                    custom={3}
                  >
                    <h3 className="text-sm text-gray-500">Total Spent</h3>
                    <p className="text-2xl font-bold">${ensureNumber(orderStats.totalSpent).toFixed(2)}</p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                    variants={cardVariants}
                    custom={4}
                  >
                    <h3 className="text-sm text-gray-500">Courses in Cart</h3>
                    <p className="text-2xl font-bold">{ensureNumber(orderStats.coursesInCart)}</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Recent Materials */}
            {showMaterials && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-emerald-600" />
                    Recently Purchased Materials
                  </h2>
                  <Button variant="outline" size="sm" asChild className="rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                    <Link href="/dashboard/materials">View All</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Only show the 4 most recent materials on the dashboard */}
                {purchasedMaterials.slice(0, 4).map((material, idx) => (
                  <motion.div 
                    key={material.id} 
                    className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 relative overflow-hidden hover:shadow-md transition-all duration-300 group"
                    variants={cardVariants}
                    custom={idx}
                  >
                    {/* Type badge */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                    
                    {/* Purchase badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {(() => {
                        // Calculate days remaining for download (default 30 days if not specified)
                        const purchaseDate = new Date(material.date);
                        const expiryDays = material.downloadExpiryDays || 30;
                        const expiryDate = new Date(purchaseDate);
                        expiryDate.setDate(expiryDate.getDate() + expiryDays);
                        
                        const today = new Date();
                        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        const isExpired = daysRemaining <= 0;
                        const isWarning = daysRemaining > 0 && daysRemaining <= 10;
                        
                        return (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                            isExpired ? 'bg-red-100 text-red-800' : 
                            isWarning ? 'bg-amber-100 text-amber-800' : 
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isExpired ? (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Expired
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                              </>
                            )}
                          </div>
                        );
                      })()} 
                    </div>

                    <div className="flex items-start space-x-3 mt-2">
                      <div className={`${material.type === "Course" ? "bg-blue-100" : "bg-emerald-100"} p-2 rounded-lg`}>
                        {material.type === "Course" ? (
                          <BookOpen className={`h-5 w-5 ${material.type === "Course" ? "text-blue-600" : "text-emerald-600"}`} />
                        ) : (
                          <FileText className={`h-5 w-5 ${material.type === "Course" ? "text-blue-600" : "text-emerald-600"}`} />
                        )}
                      </div>
                      <div className="flex-1 pr-16"> {/* Add right padding to prevent overlap with the badge */}
                        <h3 className="font-medium line-clamp-1">{material.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <span>{material.type}</span>
                          <span className="inline-block mx-2 w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>Purchased {new Date(material.date).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{material.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`${
                            material.progress < 30 ? 'bg-red-500' : 
                            material.progress < 70 ? 'bg-amber-500' : 
                            'bg-gradient-to-r from-emerald-500 to-green-500'
                          } h-2 rounded-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${material.progress}%` }}
                        ></div>
                      </div>
                    </div>
                
                    <div className="mt-4">
                      {/* Conditionally render based on download status */}
                      {material.isLoadingDownloadUrl ? (
                        <div className="flex items-center text-blue-600">
                          <span className="inline-block h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></span>
                          <span className="text-sm">Checking download...</span>
                        </div>
                      ) : (material.downloadUrl || (material.product && material.product.downloadUrl)) ? (
                        <Link 
                          href={material.downloadUrl || (material.product && material.product.downloadUrl) || '#'}
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors group-hover:text-emerald-600" 
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-blue-100 p-1.5 rounded-full mr-2 group-hover:bg-emerald-100"
                          >
                            <Download className="h-3.5 w-3.5 text-blue-600 group-hover:text-emerald-600" />
                          </motion.div>
                          <span className="text-sm font-medium">
                            Download Available
                            {material.product && material.product.fileSize && (
                              <span className="ml-1 text-xs text-gray-500 group-hover:text-gray-600">({material.product.fileSize})</span>
                            )}
                          </span>
                        </Link>
                      ) : (
                        <motion.button 
                          onClick={() => fetchProductDownloadUrl(material)} 
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors group-hover:text-emerald-600"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="bg-blue-100 p-1.5 rounded-full mr-2 group-hover:bg-emerald-100">
                            <Download className="h-3.5 w-3.5 text-blue-600 group-hover:text-emerald-600" />
                          </div>
                          <span className="text-sm">Check download availability</span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
                </div>
              </motion.div>
            )}

            {/* Recommended Resources */}
            {showRecommendations && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Recommended For You
                </h2>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                  {recommendedResources.map((resource, idx) => {
                    const IconComponent = resource.icon as React.ElementType;
                    
                    return (
                      <motion.div 
                        key={resource.id} 
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all duration-300"
                        variants={cardVariants}
                        custom={idx}
                      >
                        <div className="relative">
                          <img 
                            src={resource.image} 
                            alt={resource.title} 
                            className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className={`absolute top-2 right-2 
                            ${resource.tag === 'New' ? 'bg-gradient-to-r from-green-400 to-emerald-600' : 
                              resource.tag === 'Bestseller' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 
                              'bg-gradient-to-r from-blue-400 to-indigo-600'} 
                            text-white text-xs px-2.5 py-1 rounded-full flex items-center shadow-md`}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {resource.tag}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-lg group-hover:text-blue-600 transition-colors">{resource.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.floor(resource.rating) ? 'text-yellow-400 fill-yellow-400' : 
                                    (i === Math.floor(resource.rating) && resource.rating % 1 > 0) ? 'text-yellow-400 fill-yellow-400' : 
                                    'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium ml-2">{resource.rating}</span>
                            <span className="text-xs text-gray-500 ml-2">({resource.students} students)</span>
                          </div>
                          <div className="mt-4 flex justify-between items-center">
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              ${resource.price.toFixed(2)}
                            </span>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" asChild>
                                <Link href={`/products/${resource.title.toLowerCase().replace(/\s+/g, '-')}-${resource.id}`}>View Details</Link>
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

      {/* Display message when no materials or recommendations are available */}
      {!showMaterials && !showRecommendations && (
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              delay: 0.2
            }}
          >
            <div className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-4 shadow-sm">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>
          <h3 className="text-xl font-medium mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">No Materials Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">You haven't purchased any materials yet. Explore our catalog to find resources that match your learning goals.</p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md" asChild>
              <Link href="/products" className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Browse Resources
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Section */}
      {showCartSection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
              Your Cart
            </h2>
            {hasCartItems && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" asChild>
                  <Link href="/cart" className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    View Full Cart
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
          
          {hasCartItems ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {item.image ? (
                        <div className="w-12 h-12 rounded overflow-hidden border border-gray-200">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <ShoppingCart className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-sm font-medium">${item.finalPrice || item.price}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {cartItems.length > 3 && (
                  <div className="p-3 bg-gray-50 text-center text-sm text-gray-500">
                    +{cartItems.length - 3} more items in your cart
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">${totalPrice.toFixed(2)}</span>
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => setCartDrawerOpen(true)}
                >
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-50 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <h3 className="font-medium">Your cart is empty</h3>
              <p className="text-gray-500 mt-1">Add items to your cart to see them here</p>
              <Button asChild className="mt-4">
                <Link href="/store">Browse Products</Link>
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-purple-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              variants={cardVariants}
              custom={index}
            >
              <Link href={action.href} className="block h-full">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm p-4 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 flex items-center space-x-4 h-full group">
                  <div className={`${action.color} bg-opacity-20 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className={`h-6 w-6 ${action.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="font-medium group-hover:text-blue-600 transition-colors">{action.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <CheckCircle className="h-6 w-6 text-white" />
          <div>
            <h4 className="font-medium text-sm">Purchase Successful!</h4>
            <p className="text-xs text-green-100">Your order has been processed.</p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md md:max-w-3xl p-0 overflow-hidden rounded-xl">
          <div className="bg-blue-50 p-6 border-b border-blue-100">
            <DialogHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <DialogTitle className="text-xl text-blue-900">Checkout</DialogTitle>
              </div>
              <DialogDescription className="text-blue-700 mt-2">
                Review your cart items before proceeding to payment
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Order Summary
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                      <p className="text-gray-500 text-xs flex items-center mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                        {item.type}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="font-medium text-blue-700">${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-blue-100 pt-4 space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg pt-2">
                    <span>Total</span>
                    <span className="text-blue-700">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Payment Method
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center space-x-3">
                  <input id="card" name="payment" type="radio" className="h-4 w-4 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <label htmlFor="card" className="flex items-center cursor-pointer w-full">
                    <span className="mr-3 font-medium">Credit Card</span>
                    <div className="flex space-x-1.5">
                      <div className="w-10 h-6 bg-blue-900 rounded shadow-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Visa</span>
                      </div>
                      <div className="w-10 h-6 bg-gray-800 rounded shadow-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Amex</span>
                      </div>
                      <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded shadow-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">MC</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 bg-gray-50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowCheckoutModal(false)} 
              className="w-full sm:w-auto hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Cancel
            </Button>
            <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="button" 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" 
                onClick={handleCompleteCheckout}
              >
                <Check className="mr-2 h-4 w-4" />
                Complete Purchase
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
        <SheetContent className="w-full md:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          
          {cartItems.length > 0 ? (
            <>
              <div className="overflow-y-auto pb-16">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      {item.image && (
                        <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-100">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex gap-2 items-center">
                            <div className="text-sm font-medium">${item.finalPrice || item.price}</div>
                            {item.finalPrice && item.price > item.finalPrice && (
                              <div className="text-xs line-through text-gray-400">${item.price}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm space-x-1">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="p-1 rounded-md hover:bg-gray-100"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-md hover:bg-gray-100"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {item.packageItems && item.packageItems.length > 0 && (
                          <div className="mt-2 bg-gray-50 p-2 rounded-md">
                            <p className="text-xs text-gray-500 mb-1">Package Contents:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {item.packageItems.map((packageItem, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                  <span className="flex-1">{packageItem.title} - ${packageItem.price.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-700">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleProceedToPayment()}
                  disabled={isProcessingCheckout}
                >
                  {isProcessingCheckout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <button 
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2 p-2"
                >
                  Continue Shopping
                </button>
                
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
            </>
          ) : (
            <div className="py-12 px-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 p-5 rounded-full">
                  <ShoppingCart className="h-8 w-8 text-blue-300" />
                </div>
              </div>
              <h3 className="font-medium text-lg">Your cart is empty</h3>
              <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">
                Add some amazing resources to your cart before proceeding to checkout
              </p>
              
              <div className="space-y-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full">
                  <Link href="/store" onClick={() => setCartDrawerOpen(false)}>
                    Browse Products
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setCartDrawerOpen(false)} 
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}