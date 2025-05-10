"use client";

import { useState, useEffect } from "react";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Tag,
  Calendar,
  Clock,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon,
  PieChart,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Link,
  Share2,
  Download,
  LineChart,
  BarChart,
  RefreshCw,
  Package,
  Plus,
  ChevronRight,
  FolderTree,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import React from "react";

// Add these interfaces at the top of the file
interface CategoryPath {
  id: string;
  path: string;
  level1?: string;
  level2?: string;
  level3?: string;
  level4?: string;
  level5?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  path?: string;
  level?: number;
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ProductOrder {
  order: {
    id: string;
    userId: string;
    totalAmount: number;
    createdAt: Date;
  }
}

interface ProductType {
  id: string;
  title: string;
  description?: string;
  status: string;
  price: string;
  lastUpdated: string;
  sales: number;
  slug?: string;
  images?: ProductImage[];
  categories?: Category[];
  categoryPaths?: CategoryPath[];
  orders?: ProductOrder[];
  downloadUrl?: string;
  accessDuration?: number;
  downloadLimit?: number;
  featured?: boolean;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
  viewCount?: number;
  conversionRate?: string;
  lastPurchase?: string;
  relatedProducts?: Array<{
    id: string;
    title: string;
    price: string;
    image?: string;
  }>;
}

export function ProductDashboard({ product, isDetailedView = false }: { 
  product: ProductType; 
  isDetailedView?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(product.status === 'Published');
  const [isLoading, setIsLoading] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayProduct, setDisplayProduct] = useState({
    ...product,
    title: product.title || "Untitled Product",
    description: product.description || "No description available",
    status: product.status || "Draft",
    price: product.price || "$0.00",
    lastUpdated: product.lastUpdated || "Unknown",
    sales: product.sales || 0,
    slug: product.slug || "unknown-product",
    images: product.images || [],
    categories: product.categories || [],
    categoryPaths: product.categoryPaths || [],
    viewCount: product.viewCount || 0,
    conversionRate: product.conversionRate || "0%",
    lastPurchase: product.lastPurchase || "Never",
    featured: product.featured || false
  });
  
  // If we have a product ID but missing details, try to fetch them
  useEffect(() => {
    if (product.id && (!product.categoryPaths || !product.images || product.images.length === 0)) {
      const fetchMissingDetails = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/products/${product.id}?include=categoryPaths,images`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch product details');
          }
          
          const data = await response.json();
          
          // Create a local copy of the product with updated data
          const updatedProduct = {
            ...displayProduct, // Start with current display values as defaults
            images: data.images || [],
            categoryPaths: data.categoryPaths || [],
            categories: data.categories || [],
            // Ensure these required fields are never undefined
            description: data.description || displayProduct.description,
            slug: data.slug || displayProduct.slug,
            // Add any other fields that need defaults
          };
          
          // Update displayProduct with the new data
          setDisplayProduct(updatedProduct);
          
        } catch (err) {
          console.error('Error fetching product details in ProductDashboard:', err);
          setError('Some product details could not be loaded.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchMissingDetails();
    }
  }, [product.id]);
  
  const handlePublishToggle = () => {
    setPublishStatus(!publishStatus);
    toast.success(`Product ${!publishStatus ? 'published' : 'unpublished'} successfully`);
  };
  
  const handleShareProduct = () => {
    const productLink = `https://instudentresourses.com/products/${product.slug || product.id}`;
    
    // Try to use the clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productLink)
        .then(() => toast.success("Product link copied to clipboard"))
        .catch(() => toast.error("Failed to copy link"));
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = productLink;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast.success("Product link copied to clipboard");
      } catch (err) {
        toast.error("Failed to copy link");
      }
      
      document.body.removeChild(textArea);
    }
  };
  
  const toggleFeatured = async () => {
    if (!displayProduct.id) return;
    
    setIsFeaturing(true);
    try {
      const newFeaturedStatus = !displayProduct.featured;
      
      const response = await fetch(`/api/products/${displayProduct.id}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: newFeaturedStatus }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update featured status");
      }
      
      // Update local state
      setDisplayProduct({
        ...displayProduct,
        featured: newFeaturedStatus
      });
      
      toast.success(newFeaturedStatus 
        ? "Product added to featured" 
        : "Product removed from featured"
      );
      
    } catch (error) {
      console.error("Error updating featured status:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsFeaturing(false);
    }
  };
  
  const mainImage = product.images?.find(img => img.isPrimary)?.url || 
                    product.images?.[0]?.url || 
                    '/placeholder-image.jpg';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{displayProduct.title}</h1>
          <p className="text-gray-500">
            Product ID: #{displayProduct.id}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleShareProduct}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <a href={displayProduct.downloadUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant={displayProduct.featured ? "default" : "outline"} 
            size="sm"
            onClick={toggleFeatured}
            disabled={isFeaturing}
          >
            {isFeaturing ? (
              <>Loading...</>
            ) : (
              <>
                <Star className={`mr-2 h-4 w-4 ${displayProduct.featured ? "fill-current" : ""}`} />
                {displayProduct.featured ? "Featured" : "Feature"}
              </>
            )}
          </Button>
          <Button variant={publishStatus ? "default" : "outline"} size="sm" onClick={handlePublishToggle}>
            {publishStatus ? 
              <CheckCircle className="mr-2 h-4 w-4" /> : 
              <AlertTriangle className="mr-2 h-4 w-4" />
            }
            {publishStatus ? "Published" : "Publish"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">More options</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleShareProduct}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Product
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Assets
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* First two columns */}
        <div className="col-span-3 space-y-6">
          {/* Product summary */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 aspect-square relative rounded-md overflow-hidden border bg-gray-50">
                {mainImage && (
                  <Image 
                    src={mainImage}
                    alt={displayProduct.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="col-span-2">
                <h2 className="font-medium text-lg mb-2">{displayProduct.title}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {displayProduct.categoryPaths && displayProduct.categoryPaths.length > 0 ? (
                    displayProduct.categoryPaths.map((catPath, idx) => (
                      <Badge key={idx} variant="secondary" className="rounded-full flex items-center">
                        <span className="text-xs opacity-75 mr-1">
                          {catPath.path.split('/').join(' / ')}
                        </span>
                      </Badge>
                    ))
                  ) : displayProduct.categories && displayProduct.categories.length > 0 ? (
                    displayProduct.categories.map((category, idx) => (
                      <Badge key={idx} variant="secondary" className="rounded-full">
                        {typeof category === 'string' ? category : category.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No categories</Badge>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {displayProduct.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Tag className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        displayProduct.status === "Published" 
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {displayProduct.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Price:</span>
                      <span className="ml-2 font-medium">{displayProduct.price}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Last updated:</span>
                      <span className="ml-2">{displayProduct.lastUpdated}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Sales:</span>
                      <span className="ml-2">{displayProduct.sales} units</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Views:</span>
                      <span className="ml-2">{displayProduct.viewCount || 0}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Link className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">URL:</span>
                      <span className="ml-2 text-blue-600">
                        {displayProduct.slug && `/products/${displayProduct.slug.substring(0, 15)}...`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Overview */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium text-lg mb-4">Performance Overview</h3>
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    <div className="text-2xl font-bold">
                      ${(parseFloat(displayProduct.price.replace('$', '')) * displayProduct.sales).toFixed(2)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="text-green-500 font-medium">↑ 12.5%</span> from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    <div className="text-2xl font-bold">
                      {displayProduct.conversionRate || '3.2%'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="text-blue-500 font-medium">↑ 2.1%</span> from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-purple-500" />
                    <div className="text-2xl font-bold">
                      {displayProduct.price}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="text-purple-500 font-medium">↔ 0.0%</span> from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent Orders & Activity */}
          {isDetailedView && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium text-lg mb-4">Recent Orders</h3>
                {displayProduct.orders && displayProduct.orders.length > 0 ? (
                  <div className="space-y-4">
                    {displayProduct.orders.slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://avatar.vercel.sh/${order.order.userId}}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Order #{order.order.id.substring(0, 8)}</p>
                            <p className="text-xs text-gray-500">{formatDate(order.order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPrice(order.order.totalAmount)}</p>
                          <Badge variant="outline" className="text-xs">Completed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <ShoppingCart className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                    <p>No orders yet</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium text-lg mb-4">Product Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="mr-3 mt-1 bg-blue-100 p-2 rounded-full">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm">Someone viewed this product</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="mr-3 mt-1 bg-green-100 p-2 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm">New purchase</p>
                      <p className="text-xs text-gray-500">{displayProduct.lastPurchase || '3 hours ago'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="mr-3 mt-1 bg-yellow-100 p-2 rounded-full">
                      <RefreshCw className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm">Product updated</p>
                      <p className="text-xs text-gray-500">{displayProduct.lastUpdated}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tabs for more details */}
          <Tabs defaultValue="analytics">
            <TabsList className="mb-4">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="related">Related Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="font-medium mb-6">Sales Analytics</h3>
              
              <div className="h-64 bg-gray-50 flex items-center justify-center mb-6 rounded-lg">
                {/* Placeholder for chart - in a real app you'd use Chart.js or similar */}
                <LineChart className="h-10 w-10 text-gray-300" />
                <p className="ml-2 text-gray-500">Sales trend visualization</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold">{displayProduct.sales}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${(parseFloat(displayProduct.price.replace('$', '')) * displayProduct.sales).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Customer Satisfaction</p>
                  <p className="text-2xl font-bold">4.8/5</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Category Performance</h4>
                {displayProduct.categoryPaths && displayProduct.categoryPaths.length > 0 ? (
                  <div className="space-y-3">
                    {displayProduct.categoryPaths.map((catPath, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FolderTree className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-medium text-sm">{catPath.path}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 mr-2">Views:</span>
                            <span>{Math.floor(Math.random() * 500)}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-gray-500 mr-2">Conversion:</span>
                            <span>{(Math.random() * 5).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p>No category data available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="images" className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="font-medium mb-4">Images</h3>
              <div className="grid grid-cols-4 gap-4">
                {displayProduct.images && displayProduct.images.length > 0 ? (
                  displayProduct.images.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
                      <Image 
                        src={image.url}
                        alt={displayProduct.title}
                        fill
                        className="object-cover"
                      />
                      {image.isPrimary && (
                        <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Primary
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 py-8 text-center text-gray-500">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No images available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="font-medium mb-4">Product Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1">{displayProduct.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Categories</h4>
                  <div className="mt-2 space-y-2">
                    {displayProduct.categoryPaths && displayProduct.categoryPaths.length > 0 ? (
                      displayProduct.categoryPaths.map((catPath, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            <Package className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-medium">Category Path {idx + 1}</span>
                          </div>
                          <div className="pl-6 text-sm">
                            <div className="flex items-center text-gray-700">
                              <span className="font-medium">Full Path:</span>
                              <span className="ml-2">{catPath.path}</span>
                            </div>
                            {catPath.level1 && (
                              <div className="flex items-center mt-1 text-gray-700">
                                <span className="text-gray-500">Level 1:</span>
                                <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{catPath.level1}</span>
                              </div>
                            )}
                            {catPath.level2 && (
                              <div className="flex items-center mt-1 text-gray-700">
                                <span className="text-gray-500">Level 2:</span>
                                <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-700 rounded-full">{catPath.level2}</span>
                              </div>
                            )}
                            {catPath.level3 && (
                              <div className="flex items-center mt-1 text-gray-700">
                                <span className="text-gray-500">Level 3:</span>
                                <span className="ml-2 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full">{catPath.level3}</span>
                              </div>
                            )}
                            {catPath.level4 && (
                              <div className="flex items-center mt-1 text-gray-700">
                                <span className="text-gray-500">Level 4:</span>
                                <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{catPath.level4}</span>
                              </div>
                            )}
                            {catPath.level5 && (
                              <div className="flex items-center mt-1 text-gray-700">
                                <span className="text-gray-500">Level 5:</span>
                                <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-700 rounded-full">{catPath.level5}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : displayProduct.categories && displayProduct.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayProduct.categories.map((category, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {typeof category === 'string' ? category : category.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No categories</span>
                    )}
                  </div>
                </div>
                
                {isDetailedView && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Download URL</h4>
                      <p className="mt-1 text-blue-600 break-all">{displayProduct.downloadUrl || "No download URL available"}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Access Duration</h4>
                        <p className="mt-1">{displayProduct.accessDuration ? `${displayProduct.accessDuration} days` : "Unlimited"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Download Limit</h4>
                        <p className="mt-1">{displayProduct.downloadLimit || "Unlimited"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Created By</h4>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={displayProduct.createdBy?.image || ''} alt="Creator" />
                          <AvatarFallback>
                            {getInitials(displayProduct.createdBy?.firstName, displayProduct.createdBy?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {displayProduct.createdBy ? `${displayProduct.createdBy.firstName} ${displayProduct.createdBy.lastName}` : 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{displayProduct.createdBy?.email}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="related" className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="font-medium mb-4">Related Products</h3>
              
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-1">Filter by category:</label>
                <div className="flex flex-wrap gap-2">
                  {displayProduct.categoryPaths && displayProduct.categoryPaths.map((catPath, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => {/* Add filtering logic */}}
                    >
                      {catPath.level1 || catPath.path.split('/')[0]}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {displayProduct.relatedProducts && displayProduct.relatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {displayProduct.relatedProducts.map((relatedProduct, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="aspect-video relative">
                        {relatedProduct.image ? (
                          <Image 
                            src={relatedProduct.image}
                            alt={relatedProduct.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate">{relatedProduct.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{relatedProduct.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2">No related products found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="categories" className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Category Management</h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Category
                </Button>
              </div>
              
              {displayProduct.categoryPaths && displayProduct.categoryPaths.length > 0 ? (
                <div className="space-y-4">
                  {displayProduct.categoryPaths.map((catPath, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{catPath.path}</h4>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-sm">
                        {catPath.path.split('/').map((segment, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                            <span className="px-2 py-1 bg-gray-100 rounded-md">{segment}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <FolderTree className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2">No categories assigned to this product</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Category
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Last column - sidebar */}
        <div className="col-span-1 space-y-6">
          {/* Quick actions */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
              <Button variant="outline" className="w-full" onClick={handlePublishToggle}>
                {publishStatus ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
              <Button 
                variant={displayProduct.featured ? "default" : "outline"} 
                className="w-full"
                onClick={toggleFeatured}
                disabled={isFeaturing}
              >
                <Star className={`mr-2 h-4 w-4 ${displayProduct.featured ? "fill-current" : ""}`} />
                {displayProduct.featured ? "Remove from Featured" : "Add to Featured"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleShareProduct}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Product
              </Button>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </Button>
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Views</p>
                <p className="text-lg font-medium">{displayProduct.viewCount || "0"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-lg font-medium">{displayProduct.conversionRate || "0%"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg font-medium">
                  ${(parseFloat(displayProduct.price.replace('$', '')) * displayProduct.sales).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Purchase</p>
                <p className="text-lg font-medium">{displayProduct.lastPurchase || "Never"}</p>
              </div>
            </div>
          </div>
          
          {/* SEO Status */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-4">SEO Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">Title</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Good</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">Description</p>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Improve</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">Images</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Good</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">URL</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Good</Badge>
              </div>
              <Button variant="outline" className="w-full mt-2" size="sm">
                <PieChart className="mr-2 h-4 w-4" />
                View SEO Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatDate(date: Date | string | null): string {
  if (!date) return '';
  
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}

function formatPrice(price: number | string): string {
  return `$${Number(price).toFixed(2)}`;
}

function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'U';
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
} 