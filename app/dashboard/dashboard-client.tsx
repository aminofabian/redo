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

// Move all the data/constants here

const stats = [
  // ...same as before
];

const purchasedMaterials = [
  // ...same as before
];

const recommendedResources = [
  // ...same as before
];

interface OrderStats {
  totalOrders: number;
  unpaidOrders: number;
  completedOrders: number;
  totalSpent: number;
  coursesInCart: number;
}

export default function DashboardClient({ session }: { session: Session }) {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/order/count');
        console.log(response, 'why...............:')
        
        if (!response.ok) {
          throw new Error('Failed to fetch order statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStats();
  }, []);

  if (loading) {
    return <div>Loading order statistics...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!stats) {
    return <div>No order statistics available</div>;
  }

  // const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const firstName = (session?.user as any)?.firstName || session?.user?.name?.split(' ')[0] || 'Student';

  const quickActions = [
    {
      icon: ShoppingCart,
      label: "Buy Materials",
      href: "/store"
    },
    {
      icon: Download,
      label: "Quick Download",
      href: "/dashboard/downloads"
    },
    {
      icon: FileText,
      label: "Start Test",
      href: "/dashboard/tests"
    }
  ];

  // Rest of your UI code, same as before but using the session prop
  return (
    <div className="max-w-7xl mx-auto">
      <div className="user-order-stats">
      <h2>Your Order Summary</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>
        
        <div className="stat-card">
          <h3>Unpaid Orders</h3>
          <p>{stats.unpaidOrders}</p>
        </div>
        
        <div className="stat-card">
          <h3>Completed Orders</h3>
          <p>{stats.completedOrders}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Spent</h3>
          <p>${stats.totalSpent}</p>
        </div>
        
        <div className="stat-card">
          <h3>Courses in Cart</h3>
          <p>{stats.coursesInCart}</p>
        </div>
      </div>
    </div>
    </div>
  );
} 