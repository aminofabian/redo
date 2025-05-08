"use client";

import { useEffect, useState } from 'react';

import { motion } from "framer-motion";
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
  Check
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
  SheetClose
} from "@/components/ui/sheet";
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

// Add this near the top of the file
// API endpoints for the dashboard
const API_ENDPOINTS = {
  orderStats: '/api/order/count',
  dashboardStats: '/api/dashboard/stats',
  materials: '/api/dashboard/materials',
  recommendations: '/api/dashboard/recommendations',
  notifications: '/api/dashboard/notifications',
  // This endpoint might not exist yet, but we'll handle the error gracefully
  quickActions: '/api/dashboard/quick-actions'
} as const;

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
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
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
  const { items: cartItems, totalPrice, removeItem, updateQuantity } = useCart();
  const [showCartSection, setShowCartSection] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Define the required endpoints
        const requiredEndpoints = [
          API_ENDPOINTS.orderStats,
          API_ENDPOINTS.dashboardStats,
          API_ENDPOINTS.materials,
          API_ENDPOINTS.recommendations,
          API_ENDPOINTS.notifications
        ];

        // Fetch required data first (these should all exist)
        const [orderStatsRes, dashboardStatsRes, materialsRes, recommendationsRes, notificationsRes] = 
          await Promise.all(requiredEndpoints.map(endpoint => 
            fetch(endpoint).catch(err => {
              console.error(`Error fetching ${endpoint}:`, err);
              // Return a mock response with empty data to prevent the whole fetch from failing
              return new Response(JSON.stringify({}));
            })
          ));

        // Process the responses safely
        const getJsonSafely = async (response: Response, fallback: any = {}) => {
          try {
            return await response.json();
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
            return fallback;
          }
        };

        // Process required API responses
        const orderStatsData = await getJsonSafely(orderStatsRes, { totalOrders: 0, unpaidOrders: 0, completedOrders: 0, totalSpent: 0, coursesInCart: 0 });
        const dashboardStatsData = await getJsonSafely(dashboardStatsRes, { stats: [] });
        let materialsData = await getJsonSafely(materialsRes, []);
        
        // Log raw materials data to help debug
        console.log('Raw materials data:', materialsData);
        const recommendationsData = await getJsonSafely(recommendationsRes, []);
        const notificationsData = await getJsonSafely(notificationsRes, []);

        // Process materials data to handle nested product information if available
        const processedMaterials = Array.isArray(materialsData) ? materialsData.map(material => {
          // Log the material structure to debug what's coming from the API
          console.log(`Material ${material.id || 'unknown'} structure:`, material);
          
          // Only use the actual database values, no hardcoded fallbacks
          return material;
        }) : [];

        // Update state with required data
        setOrderStats(orderStatsData);
        setDashboardStats(transformDashboardStats(dashboardStatsData));
        setPurchasedMaterials(processedMaterials);
        setRecommendedResources(transformRecommendations(recommendationsData));
        setNotifications(notificationsData);
        
        // Try to fetch quick actions endpoint separately (it's optional)
        try {
          // Generate default quick actions in case the endpoint doesn't exist
          const defaultQuickActions = [
            { iconName: 'ShoppingCart', label: 'Buy Materials', href: '/store', color: 'bg-blue-500' },
            { iconName: 'FileText', label: 'Start Test', href: '/dashboard/tests', color: 'bg-purple-500' },
            { iconName: 'BookMarked', label: 'Study Plan', href: '/dashboard/study-plan', color: 'bg-amber-500' },
            { iconName: 'Download', label: 'Quick Download', href: '/dashboard/downloads', color: 'bg-green-500' }
          ];

          // Try to fetch quick actions, but don't block if it fails
          const quickActionsRes = await fetch(API_ENDPOINTS.quickActions);
          const quickActionsData = await quickActionsRes.json();
          
          // Process quick actions data if it exists
          if (quickActionsData && Array.isArray(quickActionsData)) {
            const mappedQuickActions = quickActionsData.map(action => ({
              icon: getIconForAction(action.iconName),
              label: action.label,
              href: action.href,
              color: action.color || 'bg-blue-500' // Fallback color
            }));
            setQuickActions(mappedQuickActions);
          }
        } catch (quickActionsErr) {
          console.warn('Quick actions endpoint not available, using default actions');
          // Use default quick actions if endpoint fails
          const defaultActions = [
            { icon: ShoppingCart, label: 'Buy Materials', href: '/store', color: 'bg-blue-500' },
            { icon: FileText, label: 'Start Test', href: '/dashboard/tests', color: 'bg-purple-500' },
            { icon: BookMarked, label: 'Study Plan', href: '/dashboard/study-plan', color: 'bg-amber-500' },
            { icon: Download, label: 'Quick Download', href: '/dashboard/downloads', color: 'bg-green-500' }
          ];
          setQuickActions(defaultActions);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Move transformation logic outside of fetch functions
  const transformDashboardStats = (data: any): DashboardStat[] => {
    if (!data || !Array.isArray(data.stats)) {
      console.error('Dashboard stats data is invalid:', data);
      return [];
    }
    
    // Map icon names to actual icon components
    const iconMap: Record<string, any> = {
      'BookOpen': BookOpen,
      'Download': Download,
      'CheckCircle': CheckCircle,
      'Clock': Clock,
      'Star': Star,
      'FileText': FileText
    };
    
    return data.stats.map((stat: any) => ({
      id: stat.id,
      title: stat.title,
      value: stat.value,
      icon: iconMap[stat.iconName] || BookOpen, // Fallback to BookOpen if icon not found
      trend: stat.trend,
      color: stat.color || 'bg-blue-500' // Fallback color
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error loading dashboard data</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4" 
              size="sm"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const firstName = (session?.user as any)?.firstName || session?.user?.name?.split(' ')[0] || 'Student';
  const hasUnreadNotifications = notifications.some(notification => !notification.read);
  
  // Function to map action names to icon components
  const getIconForAction = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'ShoppingCart': ShoppingCart,
      'Download': Download,
      'FileText': FileText,
      'BookMarked': BookMarked,
      'Star': Star,
      'Clock': Clock
    };
    return iconMap[iconName] || FileText; // Default to FileText if icon not found
  };

  // Determine if sections should be shown based on data
  const showMaterials = purchasedMaterials.length > 0;
  const showRecommendations = recommendedResources.length > 0;
  const hasCartItems = cartItems.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
          <p className="text-gray-500 mt-1">Here's an overview of your learning journey</p>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Recent Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className={cn("flex flex-col items-start py-2", 
                  !notification.read && "bg-gray-50")}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-xs text-gray-400">{notification.time}</span>
                  </div>
                  <span className="text-sm text-gray-500 mt-1">{notification.message}</span>
                </DropdownMenuItem>
              )) : (
                <DropdownMenuItem className="text-center py-4 text-gray-500">
                  No notifications yet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={(session?.user as any)?.image || undefined} />
                  <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing">Billing & Payments</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Learning Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map((stat) => (
            <div key={stat.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
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
            </div>
          ))}
        </div>
      </div>

      {/* Order Statistics */}
      {orderStats && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Your Order Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
            </div>
            
            <div 
              className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md border border-blue-100 relative group"
              onClick={() => setShowCheckoutModal(true)}
            >
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
                <ShoppingCart className="h-3 w-3 mr-1" />
                <span>View Cart</span>
              </div>
              <h3 className="text-sm text-blue-600 font-medium">Unpaid Orders</h3>
              <p className="text-2xl font-bold text-blue-700">{orderStats.unpaidOrders}</p>
              <div className="mt-2 text-xs text-blue-500 flex items-center">
                <span>Click to checkout</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm text-gray-500">Completed Orders</h3>
              <p className="text-2xl font-bold">{orderStats.completedOrders}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm text-gray-500">Total Spent</h3>
              <p className="text-2xl font-bold">${orderStats.totalSpent}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm text-gray-500">Courses in Cart</h3>
              <p className="text-2xl font-bold">{orderStats.coursesInCart}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Materials */}
      {showMaterials && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recently Purchased Materials</h2>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/materials">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {purchasedMaterials.map((material) => (
              <div key={material.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden">
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
                        'bg-green-100 text-green-800'
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

                <div className="flex items-start space-x-3">
                  <div className={`${material.type === "Course" ? "bg-blue-50" : "bg-green-50"} p-2 rounded-lg`}>
                    {material.type === "Course" ? (
                      <BookOpen className={`h-5 w-5 ${material.type === "Course" ? "text-blue-500" : "text-green-500"}`} />
                    ) : (
                      <FileText className={`h-5 w-5 ${material.type === "Course" ? "text-blue-500" : "text-green-500"}`} />
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
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`${material.progress < 30 ? 'bg-red-500' : material.progress < 70 ? 'bg-amber-500' : 'bg-green-500'} h-1.5 rounded-full`} 
                      style={{ width: `${material.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-4">
                  {/* Conditionally render based on download status */}
                  {material.isLoadingDownloadUrl ? (
                    <div className="flex items-center text-blue-500">
                      <span className="inline-block h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></span>
                      <span className="text-sm">Checking download...</span>
                    </div>
                  ) : (material.downloadUrl || (material.product && material.product.downloadUrl)) ? (
                    <Link 
                      href={material.downloadUrl || (material.product && material.product.downloadUrl) || '#'}
                      className="flex items-center text-blue-600 hover:text-blue-800 hover:underline" 
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-sm font-medium">
                        Download Available
                        {material.product && material.product.fileSize && (
                          <span className="ml-1 text-xs text-gray-500">({material.product.fileSize})</span>
                        )}
                      </span>
                    </Link>
                  ) : (
                    <button 
                      onClick={() => fetchProductDownloadUrl(material)} 
                      className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-sm">Check download availability</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Recommended Resources */}
      {showRecommendations && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recommended For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedResources.map((resource) => {
              const IconComponent = resource.icon as React.ElementType;
              
              return (
                <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={resource.image} 
                      alt={resource.title} 
                      className="w-full h-32 object-cover"
                    />
                    <div className={`absolute top-2 right-2 ${resource.tag === 'New' ? 'bg-green-500' : resource.tag === 'Bestseller' ? 'bg-amber-500' : 'bg-blue-500'} text-white text-xs px-2 py-1 rounded-full flex items-center`}>
                      <IconComponent className="h-3 w-3 mr-1" />
                      {resource.tag}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium">{resource.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{resource.rating}</span>
                      <span className="text-xs text-gray-500 ml-2">({resource.students} students)</span>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="font-bold">${resource.price}</span>
                      <Button size="sm" asChild>
                        <Link href={`/products/${resource.title.toLowerCase().replace(/\s+/g, '-')}-${resource.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Display message when no materials or recommendations are available */}
      {!showMaterials && !showRecommendations && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="font-medium text-blue-800">No materials found</h3>
          <p className="text-blue-700 mt-1">You haven't purchased any materials yet.</p>
          <Button asChild className="mt-4">
            <Link href="/store">Browse our catalog</Link>
          </Button>
        </div>
      )}

      {/* Cart Section */}
      {showCartSection && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Cart</h2>
            {hasCartItems && (
              <Button variant="ghost" asChild>
                <Link href="/cart">View Full Cart</Link>
              </Button>
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
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-blue-500 transition-colors duration-200 flex items-center space-x-4">
                <div className={`${action.color} bg-opacity-10 p-3 rounded-lg`}>
                  <action.icon className={`h-6 w-6 ${action.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="font-medium">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
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
          
          {cartItems.length > 0 ? (
            <>
              <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 h-5 w-5 text-xs text-blue-600">{cartItems.length}</span>
                  Items in Your Cart
                </h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-50 p-2.5 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                          <ShoppingCart className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center mt-1">
                            <span className="text-sm font-medium">
                              ${(item.finalPrice || item.price).toFixed(2)}
                            </span>
                            <span className="mx-2 text-gray-400">•</span>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          {item.isPackage && item.packageItems && (
                            <div className="mt-2 pl-2 border-l-2 border-blue-100">
                              <p className="text-xs text-gray-500 mb-1">Package Contents:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {item.packageItems.map((packageItem, index) => (
                                  <li key={index}>
                                    • {packageItem.title} - ${packageItem.price.toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          ${((item.finalPrice || item.price) * item.quantity).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" aria-label="Remove item" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Taxes (10%)</span>
                    <span className="font-medium">${(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium text-lg pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-700">${(totalPrice * 1.1).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="sm:order-1">
                    Cancel
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 sm:order-2">
                    <Link href="/cart/checkout" className="flex items-center justify-center">
                      Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 px-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 p-5 rounded-full">
                  <ShoppingCart className="h-8 w-8 text-blue-300" />
                </div>
              </div>
              <h3 className="font-medium text-lg">Your cart is empty</h3>
              <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">Add some amazing resources to your cart before proceeding to checkout</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="sm:order-1">
                  Close
                </Button>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 sm:order-2">
                  <Link href="/store" onClick={() => setShowCheckoutModal(false)}>
                    Browse Products
                  </Link>
                </Button>
              </div>
            </div>
          )}
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
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Taxes (10%)</span>
                    <span className="font-medium">${(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-700">${(totalPrice * 1.1).toFixed(2)}</span>
                  </div>
                </div>
                
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/cart/checkout">
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <button 
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2 p-2"
                >
                  Continue Shopping
                </button>
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