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
  ShoppingCart,
  X,
  Sparkles,
  Zap,
  Rocket,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all the data
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch order statistics
        await fetchOrderStats();
        
        // Fetch dashboard statistics
        await fetchDashboardStats();
        
        // Fetch purchased materials
        await fetchPurchasedMaterials();
        
        // Fetch recommended resources
        await fetchRecommendations();
        
        // Fetch notifications
        await fetchNotifications();
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Function to fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const response = await fetch('/api/order/count');
      
      if (!response.ok) {
        throw new Error('Failed to fetch order statistics');
      }
      
      const data = await response.json();
      setOrderStats(data);
    } catch (err) {
      console.error('Error fetching order stats:', err);
      // Fallback data if API fails
      setOrderStats({
        totalOrders: 0,
        unpaidOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        coursesInCart: 0
      });
    }
  };

  // Function to fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const data = await response.json();
      
      // Transform API data to dashboard stats format
      const stats: DashboardStat[] = [
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
      
      setDashboardStats(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      // Fallback data if API fails
      setDashboardStats([
        {
          id: 1,
          title: "Courses Enrolled",
          value: 0,
          icon: BookOpen,
          trend: "0",
          color: "bg-blue-500",
        },
        {
          id: 2,
          title: "Materials Downloaded",
          value: 0,
          icon: Download,
          trend: "0",
          color: "bg-green-500",
        },
        {
          id: 3,
          title: "Tests Completed",
          value: 0,
          icon: CheckCircle,
          trend: "0",
          color: "bg-purple-500",
        },
        {
          id: 4,
          title: "Study Hours",
          value: 0,
          icon: Clock,
          trend: "0",
          color: "bg-amber-500",
        },
      ]);
    }
  };

  // Function to fetch purchased materials
  const fetchPurchasedMaterials = async () => {
    try {
      const response = await fetch('/api/dashboard/materials');
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchased materials');
      }
      
      const data = await response.json();
      setPurchasedMaterials(data);
    } catch (err) {
      console.error('Error fetching purchased materials:', err);
      // Empty array as fallback
      setPurchasedMaterials([]);
    }
  };

  // Function to fetch recommended resources
  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/dashboard/recommendations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendedResources(data.map((item: any) => ({
        ...item,
        icon: getIconForTag(item.tag)
      })));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      // Empty array as fallback
      setRecommendedResources([]);
    }
  };

  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/dashboard/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Empty array as fallback
      setNotifications([]);
    }
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-medium text-gray-700">Loading your dashboard...</p>
            <p className="text-gray-500 mt-2">Fetching your latest learning data</p>
          </div>
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
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm text-gray-500">Unpaid Orders</h3>
              <p className="text-2xl font-bold">{orderStats.unpaidOrders}</p>
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
    </div>
  );
}