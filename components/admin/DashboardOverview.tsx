"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  PlusCircle,
  Tag,
  Settings,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface DashboardData {
  totalProducts: number;
  newProductsThisWeek: number;
  totalUsers: number;
  newUsersThisMonth: number;
  totalSales: number;
  salesPercentChange: number;
  avgOrderValue: number;
  avgOrderValuePercentChange: number;
  recentActivity: Array<{
    type: string;
    user: {
      id: string;
      name: string;
      image?: string | null;
    };
    productName?: string;
    timestamp: Date;
    id: string;
  }>;
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!data || !data.recentActivity) {
    return (
      <div className="p-6 text-center text-amber-500">
        <p>No dashboard data is available. This could happen if your database is empty.</p>
        <p className="text-sm text-gray-500 mt-2">
          Try adding some products and users to see stats here.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {/* Display admin name here */}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-500" />
              <div className="text-2xl font-bold">{data.totalProducts}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className={data.newProductsThisWeek > 0 ? "text-green-500 font-medium" : "text-gray-500"}>
                {data.newProductsThisWeek > 0 && '+'}{data.newProductsThisWeek} this week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              <div className="text-2xl font-bold">{data.totalUsers}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className={data.newUsersThisMonth > 0 ? "text-green-500 font-medium" : "text-gray-500"}>
                {data.newUsersThisMonth > 0 && '+'}{data.newUsersThisMonth} this month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              <div className="text-2xl font-bold">
                ${typeof data.totalSales === 'number' 
                  ? data.totalSales.toFixed(2) 
                  : Number(data.totalSales).toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className={`flex items-center ${data.salesPercentChange >= 0 ? "text-green-500" : "text-red-500"} font-medium`}>
                {data.salesPercentChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {Math.abs(data.salesPercentChange).toFixed(1)}% vs last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-purple-500" />
              <div className="text-2xl font-bold">${data.avgOrderValue.toFixed(2)}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className={`flex items-center ${data.avgOrderValuePercentChange >= 0 ? "text-green-500" : "text-red-500"} font-medium`}>
                {data.avgOrderValuePercentChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {Math.abs(data.avgOrderValuePercentChange).toFixed(1)}% vs last month
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Tag className="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              View All Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Site Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.image || ''} />
                    <AvatarFallback>
                      {activity.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>{' '}
                      {activity.type === 'purchase' && (
                        <>purchased <span className="font-medium">{activity.productName}</span></>
                      )}
                      {activity.type === 'registration' && 'registered'}
                      {activity.type === 'review' && (
                        <>reviewed <span className="font-medium">{activity.productName}</span></>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-sm text-gray-500 mt-2">
                View all activity →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 