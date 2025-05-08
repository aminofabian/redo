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
  ArrowRight
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
const API_ENDPOINTS = {
  orderStats: '/api/order/count',
  dashboardStats: '/api/dashboard/stats',
  materials: '/api/dashboard/materials',
  recommendations: '/api/dashboard/recommendations',
  notifications: '/api/dashboard/notifications'
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
  
  // Cart state through context
  const { items: cartItems, totalPrice, removeItem, updateQuantity } = useCart();
  const [showCartSection, setShowCartSection] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [
          orderStatsRes,
          dashboardStatsRes,
          materialsRes,
          recommendationsRes,
          notificationsRes
        ] = await Promise.all([
          fetch(API_ENDPOINTS.orderStats),
          fetch(API_ENDPOINTS.dashboardStats),
          fetch(API_ENDPOINTS.materials),
          fetch(API_ENDPOINTS.recommendations),
          fetch(API_ENDPOINTS.notifications)
        ]);

        // Process all responses in parallel
        const [
          orderStatsData,
          dashboardStatsData,
          materialsData,
          recommendationsData,
          notificationsData
        ] = await Promise.all([
          orderStatsRes.json(),
          dashboardStatsRes.json(),
          materialsRes.json(),
          recommendationsRes.json(),
          notificationsRes.json()
        ]);

        // Update all state at once to minimize re-renders
        setOrderStats(orderStatsData);
        setDashboardStats(transformDashboardStats(dashboardStatsData));
        setPurchasedMaterials(materialsData);
        setRecommendedResources(transformRecommendations(recommendationsData));
        setNotifications(notificationsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Move transformation logic outside of fetch functions
  const transformDashboardStats = (data: any): DashboardStat[] => {
    return [
      {
        id: 1,
        title: "Courses Enrolled",
        value: data.coursesEnrolled,
        icon: BookOpen,
        trend: "+2",
        color: "bg-blue-500",
      },
      {
        id: 2,
        title: "Materials Downloaded",
        value: data.materialsDownloaded,
        icon: Download,
        trend: "+5",
        color: "bg-green-500",
      },
      {
        id: 3,
        title: "Tests Completed",
        value: data.testsCompleted,
        icon: CheckCircle,
        trend: "+3",
        color: "bg-purple-500",
      },
      {
        id: 4,
        title: "Study Hours",
        value: data.studyHours,
        icon: Clock,
        trend: "+7",
        color: "bg-amber-500",
      },
    ];
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

  const quickActions = [
    {
      icon: ShoppingCart,
      label: "Buy Materials",
      href: "/store",
      color: "bg-blue-500"
    },
    {
      icon: Download,
      label: "Quick Download",
      href: "/dashboard/downloads",
      color: "bg-green-500"
    },
    {
      icon: FileText,
      label: "Start Test",
      href: "/dashboard/tests",
      color: "bg-purple-500"
    },
    {
      icon: BookMarked,
      label: "Study Plan",
      href: "/dashboard/study-plan",
      color: "bg-amber-500"
    }
  ];

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
                  <p className="text-xs text-green-600 mt-1">{stat.trend} this week</p>
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
              <div key={material.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    {material.type === "Course" ? (
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{material.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{material.type}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{material.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${material.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <span className="text-xs text-gray-500">Added on {material.date}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/materials/${material.productId}`}>Continue</Link>
                  </Button>
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
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
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
                        <Link href={`/product/${resource.id}`}>View Details</Link>
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
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-blue-500" />
                      </div>
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
                <Button className="w-full mt-2" asChild>
                  <Link href="/cart/checkout">
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
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
                <div className="bg-blue-50 p-3 rounded-lg">
                  <action.icon className="h-6 w-6 text-blue-500" />
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
    </div>
  );
}