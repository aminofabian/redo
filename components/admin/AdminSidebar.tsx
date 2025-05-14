"use client";

import { cn } from "@/lib/utils";
import { 
  LayoutGrid,
  Package,
  Users2,
  FileText,
  BarChart3,
  Settings,
  Search,
  Plus,
  Tags,
  ChevronRight,
  ShoppingCart,
  Clock,
  AlertCircle,
  Filter,
  Loader2,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/contexts/AdminContext";
import { FilterSidebar } from "./FilterSidebar";
import { ProductDrawer } from "./ProductDrawer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PaymentGatewaySidebar from "./PaymentGatewaySidebar";

// Updated interface for real product data
interface Product {
  id: string;
  title: string;
  status: string;
  lastUpdated: string;
  price: string;
  sales: number;
  description?: string;
  images: { id: string; url: string; isPrimary: boolean; }[];
  categories: string[];
  slug?: string;
  viewCount?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
}

// Keep the function definition
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();                  // Trim leading/trailing spaces
}

export default function AdminSidebar() {
  const {
    activeMenu,
    setActiveMenu,
    selectedItem,
    setSelectedItem,
    sidebarFilter,
    setSidebarFilter,
  } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add these hook calls inside the component with loading state
  const [productCounts, setProductCounts] = useState({
    total: 0,
    studyGuides: 0,
    practiceTests: 0,
    videoCourses: 0
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // Add this state for user counts
  const [userCounts, setUserCounts] = useState({
    total: 0,
    verified: 0,
    regular: 0,
    admin: 0,
    pending: 0
  });

  // Add state to track drawer visibility
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);

  // Add at the top with other state
  const [users, setUsers] = useState<User[]>([]);

  const router = useRouter();

  useEffect(() => {
    // Fetch all products from the mock API and count them
    async function fetchAndCountProducts() {
      setIsLoadingCounts(true);
      try {
        console.log('Fetching products from mock API to count them...');
        // Using the mock products API which is known to work
        const response = await fetch('/api/mock/products');
        
        if (response.ok) {
          const products = await response.json();
          console.log(`Got ${products.length} products from API for counting`);
          
          if (Array.isArray(products) && products.length > 0) {
            // Count by categories
            let studyGuides = 0;
            let practiceTests = 0;
            let videoCourses = 0;
            
            // Examine each product's categories
            products.forEach(product => {
              if (product.categories) {
                product.categories.forEach((category: string) => {
                  const catLower = category.toLowerCase();
                  if (catLower.includes('study') || catLower.includes('guide')) {
                    studyGuides++;
                  }
                  if (catLower.includes('practice') || catLower.includes('test')) {
                    practiceTests++;
                  }
                  if (catLower.includes('video') || catLower.includes('course')) {
                    videoCourses++;
                  }
                });
              }
            });
            
            // Set the actual counts from the data
            setProductCounts({
              total: products.length,
              studyGuides: Math.max(studyGuides, 1),
              practiceTests: Math.max(practiceTests, 1),
              videoCourses: Math.max(videoCourses, 1)
            });
          }
        } else {
          console.error('Error fetching products:', response.status);
        }
      } catch (error) {
        console.error('Error counting products:', error);
      } finally {
        setIsLoadingCounts(false);
      }
    }
    
    // Run the function to get actual counts
    fetchAndCountProducts();
  }, []);

  // Add this useEffect to fetch user counts
  useEffect(() => {
    async function fetchUserCounts() {
      try {
        // Use the working API endpoint we created earlier
        const response = await fetch('/api/admin/user-stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user counts');
        }
        
        const data = await response.json();
        setUserCounts(data);
      } catch (error) {
        console.error('Error fetching user counts:', error);
        // Set a default state or show error notification
        setUserCounts({
          total: 0,
          verified: 0,
          regular: 0,
          admin: 0,
          pending: 0
        });
      }
    }
    
    fetchUserCounts();
  }, []);
  
  // Then create mainMenuItems inside the component using the state
  const mainMenuItems = [
    {
      title: "Overview",
      icon: LayoutGrid,
      href: "/admin",
      directNav: true,
      badge: "",
    },
    {
      title: "Products",
      icon: Package,
      href: "/admin/products",
      badge: isLoadingCounts ? "..." : productCounts.total.toString(),
      subItems: [
        { title: "All Products", count: productCounts.total },
        { title: "Study Guides", count: productCounts.studyGuides },
        { title: "Practice Tests", count: productCounts.practiceTests },
        { title: "Video Courses", count: productCounts.videoCourses },
      ]
    },
    {
      title: "Users",
      icon: Users2,
      href: "/admin/users",
      badge: userCounts.total.toString(),
      subItems: [
        { title: "All Users", count: userCounts.total },
        { title: "Verified", count: userCounts.verified },
        { title: "Regular", count: userCounts.regular },
        { title: "Admins", count: userCounts.admin },
        { title: "Pending", count: userCounts.pending },
      ]
    },
    {
      title: "Orders",
      icon: ShoppingCart,
      href: "/admin/orders",
      badge: "12",
      subItems: [
        { title: "All Orders", count: 385 },
        { title: "Pending", count: 12 },
        { title: "Completed", count: 364 },
        { title: "Refunded", count: 9 },
      ]
    },
    {
      title: "Content",
      icon: FileText,
      href: "/admin/content",
      badge: "",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      badge: "",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings",
      badge: "",
    },
    {
      title: "Payment Settings",
      icon: CreditCard,
      href: "#",
      directNav: false,
      badge: "",
    }
  ];

  // Fetch products when activeMenu is "Products" or when search term changes
  useEffect(() => {
    if (activeMenu === "Products") {
      fetchProducts();
    }
  }, [activeMenu, searchTerm]);

  // Function to fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try the real API
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        // If real API fails, use mock API
        console.log("Using mock product data");
        const mockResponse = await fetch(`/api/mock/products?search=${encodeURIComponent(searchTerm)}`);
        
        if (!mockResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const mockData = await mockResponse.json();
        setProducts(mockData);
        return;
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Could not load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the fetchProductDetails function
  const fetchProductDetails = async (productId: string | number) => {
    try {
      // Ensure we're working with a string ID for the URL
      const idString = productId.toString();
      
      // Try the mock API first for development
      const mockResponse = await fetch(`/api/mock/products/${idString}`);
      
      if (mockResponse.ok) {
        console.log("Using mock product details");
        return await mockResponse.json();
      }
      
      // If mock fails, try the real API
      const response = await fetch(`/api/products/${idString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product details: ${await response.text()}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching product details:', err);
      // Return a minimal product object to avoid UI errors
      return {
        id: productId.toString(),
        title: "Product Details Unavailable",
        description: "Could not load product details. Please try again later.",
        status: "Unknown",
        price: "$0.00",
        lastUpdated: "Unknown",
        sales: 0,
        slug: "unknown",
        images: [],
        categories: []
      };
    }
  };

  // Update the product selection handler with better error handling
  const handleProductSelect = async (product: Product) => {
    try {
      // First set the basic product info to show something immediately
      setSelectedItem({
        ...product,
        slug: product.slug || generateSlug(product.title),
        viewCount: product.viewCount || 0,
      });
      
      // Then fetch the full product details
      const detailedProduct = await fetchProductDetails(product.id);
      if (detailedProduct) {
        // Update with the complete product details
        setSelectedItem(detailedProduct);
      }
    } catch (error) {
      console.error("Error selecting product:", error);
      // Keep the basic product info displayed
    }
  };

  // Add a useEffect for fetching users
  useEffect(() => {
    if (activeMenu === "Users") {
      fetchUsers();
    }
  }, [activeMenu, searchTerm]);

  // Add the fetchUsers function
  const fetchUsers = async () => {
    if (activeMenu !== "Users") return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users...');
      
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users fetched:', data);
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Could not load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Main Sidebar */}
      <div className="w-64 bg-white border-r">
        {/* Quick Actions */}
        <div className="p-4 space-y-3 border-b">
          <Button 
            className="w-full bg-[#1e2c51] hover:bg-[#1e2c51]/90 gap-2 text-white"
            onClick={() => setActiveMenu("Products")}
          >
            <Package className="w-4 h-4 text-white" />
            Manage Products
          </Button>
          <Button 
            variant="outline"
            className="w-full gap-2"
            onClick={() => setIsProductDrawerOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Button>
        </div>
        
        {/* Main Navigation */}
        <nav className="p-2">
          {mainMenuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                setActiveMenu(item.title);
                setSelectedItem(null);
                // For direct navigation items like Dashboard, keep the navigation
                if (item.directNav) {
                  router.push(item.href);
                }
              }}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md",
                "transition-colors duration-200",
                activeMenu === item.title
                  ? "bg-[#1e2c51] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  activeMenu === item.title
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {item.badge}
                </span>
              )}
              {item.subItems && (
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  activeMenu === item.title && "rotate-90"
                )} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Secondary Sidebar */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-gray-50 border-r overflow-hidden"
          >
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={activeMenu === "Products" ? "Search products..." : "Search users..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="p-2">
              {activeMenu === "Products" && (
                <div className="space-y-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center text-red-500">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                      <p>{error}</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No products found</p>
                    </div>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left",
                          "transition-colors duration-200",
                          selectedItem?.id === product.id
                            ? "bg-white shadow-sm border"
                            : "hover:bg-white/60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
                            {product.title}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            product.status === "Published" 
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          )}>
                            {product.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                          <span>{product.price}</span>
                          <span>•</span>
                          <span>{product.lastUpdated}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeMenu === "Users" && (
                <div className="space-y-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center text-red-500">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                      <p>{error}</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center text-gray-700">
                      <p>No users found</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedItem?.id === user.id
                            ? "bg-white shadow-sm border"
                            : "hover:bg-white/50"
                        }`}
                        onClick={() => setSelectedItem(user)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || ''} />
                            <AvatarFallback>
                              {user.name 
                                ? user.name.split(' ').map(n => n?.[0] || '').join('').toUpperCase() 
                                : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{user.name}</p>
                              <Badge variant={
                                user.role === 'ADMIN' ? 'destructive' : 
                                user.role === 'VERIFIED_USER' ? 'default' : 'outline'
                              }>
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeMenu === "Payment Settings" && (
                <PaymentGatewaySidebar />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Drawer */}
      <ProductDrawer 
        open={isProductDrawerOpen} 
        onClose={() => setIsProductDrawerOpen(false)}
        onPreviewOpen={() => {}}
      />
    </div>
  );
} 