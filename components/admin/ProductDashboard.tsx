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
  Package
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

// Add this interface at the top of the file
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
  categories?: string[];
  orders?: ProductOrder[];
  downloadUrl?: string;
  accessDuration?: number;
  downloadLimit?: number;
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
  const [error, setError] = useState<string | null>(null);
  
  // Ensure we have valid data to display
  const displayProduct = {
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
    viewCount: product.viewCount || 0,
    conversionRate: product.conversionRate || "0%",
    lastPurchase: product.lastPurchase || "Never"
  };
  
  // If we have a product ID but missing details, try to fetch them
  useEffect(() => {
    if (product.id && (!product.images || product.images.length === 0)) {
      const fetchMissingDetails = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/products/${product.id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch product details');
          }
          
          // We don't need to do anything with the response here
          // This is just a backup in case the product details weren't fetched earlier
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
                  {displayProduct.categories && displayProduct.categories.map((category, idx) => (
                    <Badge key={idx} variant="secondary" className="rounded-full">
                      {category}
                    </Badge>
                  ))}
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
                  <div className="mt-1 flex flex-wrap gap-2">
                    {displayProduct.categories && displayProduct.categories.length > 0 ? (
                      displayProduct.categories.map((category, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {category}
                        </span>
                      ))
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