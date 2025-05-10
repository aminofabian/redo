'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Download,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Types for API response
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: number;
    title: string;
    imageUrl: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
  transaction: {
    status: string;
    completedAt: string;
    amount: number;
    currency: string;
  };
}

interface OrdersResponse {
  orders: Order[];
}

const UserOrdersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get<OrdersResponse>('/api/completed');
        setOrders(response.data.orders);
        setError(null);
      } catch (err) {
        setError('Failed to fetch your orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-red-900">Error loading orders</h3>
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
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <p className="text-muted-foreground mt-2">
            Browse our products and make your first purchase!
          </p>
          <Button asChild className="mt-6">
            <Link href="/store">Browse Products</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground mt-1">View and manage your purchases</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Orders: </span>
              <span className="font-medium">{orders.length}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm">
              <span className="text-muted-foreground">Total Spent: </span>
              <span className="font-medium">
                {orders[0]?.transaction.currency} 
                {orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-green-50/50">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Completed Orders</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status.toLowerCase() === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          {/* Add more stat cards as needed */}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map(order => {
          const StatusIcon = getStatusIcon(order.status);
          
          return (
            <Card key={order.id} className="overflow-hidden">
              {/* Order Header */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Order #{order.id.substring(0, 8)}</h3>
                      <Badge 
                        variant="outline"
                        className={`${getStatusColor(order.status)} capitalize`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {order.transaction.currency} {order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.orderItems.length} item(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6 space-y-4">
                {order.orderItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.product.imageUrl && (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.product.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {order.transaction.currency} {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/orders/${order.id}`}>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    View Details
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/orders/${order.id}/download`}>
                      <Download className="h-4 w-4 mr-1" />
                      Download Invoice
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/materials`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Access Materials
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UserOrdersPage;