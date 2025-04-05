"use client";

import { useState, useEffect } from "react";
import { 
  Plus,
  Package,
  DollarSign,
  Image as ImageIcon,
  Upload,
  X,
  Link as LinkIcon,
  Percent,
  Calendar,
  Clock,
  Tag,
  Download,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  ShoppingCart,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProductDrawer } from "@/components/admin/ProductDrawer";
import { AdminProvider, useAdmin, type Product, type User } from "@/contexts/AdminContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ProductDetails } from "@/components/admin/ProductDetails";
import { ProductDashboard } from "@/components/admin/ProductDashboard";
import { UserDashboard } from "@/components/admin/UserDashboard";
import { FilterSidebar } from "@/components/admin/FilterSidebar";

// Add this type guard function
function isProduct(item: any): item is Product {
  return item && 'title' in item && 'price' in item;
}

function isUser(item: any): item is User {
  return item && 'email' in item && 'role' in item;
}

// Main content component
function AdminContent() {
  const { activeMenu, selectedItem } = useAdmin();
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed product data when a product is selected
  useEffect(() => {
    if (activeMenu === "Products" && selectedItem?.id) {
      fetchProductDetails(selectedItem.id);
    }
  }, [activeMenu, selectedItem]);

  const fetchProductDetails = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      const data = await response.json();
      setProductData(data);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Could not load product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show product details when a product is selected
  if (activeMenu === "Products" && selectedItem && isProduct(selectedItem)) {
    return (
      <div className="flex flex-col h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <ProductDashboard 
            product={productData || selectedItem} 
            isDetailedView={!!productData}
          />
        )}
      </div>
    );
  }

  if (activeMenu === "Users" && selectedItem && isUser(selectedItem)) {
    return (
      <div className="flex flex-col h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <UserDashboard user={selectedItem} />
        )}
      </div>
    );
  }
  
  // Default dashboard content when no item is selected
  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {activeMenu === "Products" && (
        <p className="text-gray-500">Select a product from the sidebar to view details</p>
      )}
      {activeMenu === "Users" && (
        <p className="text-gray-500">Select a user from the sidebar to view details</p>
      )}
      {activeMenu === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dashboard overview cards would go here */}
          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="font-medium">Total Sales</h3>
            <p className="text-2xl font-bold mt-2">$12,345</p>
          </div>
          {/* More cards */}
        </div>
      )}
    </div>
  );
}

// Main admin page
export default function AdminPage() {
  return <AdminContent />;
} 