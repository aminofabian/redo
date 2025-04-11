"use client";

import { useState } from "react";
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
import { ProductDashboard } from "@/components/admin/ProductDashboard";
import { UserDashboard } from "@/components/admin/UserDashboard";
import { FilterSidebar } from "@/components/admin/FilterSidebar";
import { Header } from "@/components/admin/Header";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

// Define ProductImage type
type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;  // Make isPrimary required, not optional
};

// Define ProductType locally instead of importing it
type ProductType = {
  id: string;
  title: string;
  description: string;
  status: string;
  price: any;
  lastUpdated: string;
  sales: number;
  slug: string;
  images: ProductImage[];  // Use the ProductImage type
  categories: string[];
  viewCount: number;
  conversionRate: string;
  lastPurchase: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

// Type guard functions
function isProduct(item: any): item is Product {
  return item && 'title' in item && 'price' in item;
}

function isUser(item: any): item is User {
  return item && 'email' in item && 'role' in item;
}

// Function to map Product to ProductType
function mapProductToProductType(product: Product): ProductType {
  return {
    id: String(product.id),
    title: product.title,
    description: product.description || "",
    status: product.status || "Draft",
    price: product.price,
    lastUpdated: product.lastUpdated || new Date().toISOString(),
    sales: product.sales || 0,
    slug: product.slug || "",
    images: product.images?.map(img => ({
      id: String(img.id),
      url: img.url,
      isPrimary: img.isPrimary === true  // Ensure it's a boolean (true/false)
    })) || [],
    categories: product.categories || [],
    viewCount: product.viewCount || 0,
    conversionRate: "0%",
    lastPurchase: "Never",
    createdBy: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com"
    }
  };
}

// Main content component
function AdminContent() {
  const { activeMenu, selectedItem } = useAdmin();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add a debug log to see what's happening
  console.log("Active Menu:", activeMenu);
  console.log("Selected Item:", selectedItem);

  // If we're in the Products menu and have a selected item, but it's still loading details
  if (activeMenu === "Products" && selectedItem && isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mr-2" />
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header onAddProduct={() => setIsAddProductOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-gray-50">
          {activeMenu === "Overview" ? (
            <DashboardOverview />
          ) : activeMenu === "Products" && selectedItem && isProduct(selectedItem) ? (
            <ProductDashboard 
              product={mapProductToProductType(selectedItem)} 
              isDetailedView={true} 
            />
          ) : activeMenu === "Users" && selectedItem && isUser(selectedItem) ? (
            <UserDashboard user={selectedItem} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select an item from the sidebar to view details</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Product Drawer */}
      <ProductDrawer 
        open={isAddProductOpen} 
        onClose={() => setIsAddProductOpen(false)}
        onPreviewOpen={() => {}}
      />
    </div>
  );
}

// Main admin client component 
export default function AdminClient() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
} 