"use client";

import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Tag,
  Calendar,
  Clock,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { generateProductSlug } from "@/lib/products";

export function ProductDetails() {
  const { selectedItem: product } = useAdmin();
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState(product?.slug || "");
  
  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a product to view details</p>
      </div>
    );
  }

  const mainImage = product.images?.find(img => img.isPrimary)?.url || 
                    product.images?.[0]?.url || 
                    '/placeholder-image.jpg';

  const fetchProductDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return await response.json();
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  };

  const handleSlugUpdate = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: slugValue }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update slug");
      }
      
      toast.success("URL slug updated successfully");
      setIsEditingSlug(false);
    } catch (error) {
      toast.error(error.message || "An error occurred");
    }
  };
  
  const regenerateSlug = () => {
    const newSlug = generateProductSlug(product);
    setSlugValue(newSlug);
  };

  const hasDiscount = product.discountAmount || product.discountPercent || product.finalPrice;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Product summary */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-square relative rounded-md overflow-hidden border bg-gray-50">
                {mainImage && (
                  <Image 
                    src={mainImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <h2 className="font-medium text-lg mb-4">{product.title}</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {product.description || "No description available"}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Tag className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      product.status === "Published" 
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-medium">{product.price}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Sales:</span>
                    <span className="ml-2">{product.sales} units</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Last updated:</span>
                    <span className="ml-2">{product.lastUpdated}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs for more details */}
          <Tabs defaultValue="images">
            <TabsList className="mb-4">
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="images" className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium mb-4">Images</h3>
              <div className="grid grid-cols-4 gap-4">
                {product.images && product.images.length > 0 ? (
                  product.images.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
                      <Image 
                        src={image.url}
                        alt={product.title}
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
            
            <TabsContent value="details" className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium mb-4">Product Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1">{product.description || "No description available"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Categories</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map((category, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {category}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No categories</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Pricing</h4>
                  <div className="mt-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Original Price</span>
                        <span className={hasDiscount ? "line-through text-gray-500" : "font-medium"}>
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </div>
                      
                      {hasDiscount && (
                        <>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Discount</span>
                            <span className="text-green-600">
                              {product.discountPercent ? 
                                `${product.discountPercent}%` : 
                                `$${Number(product.discountAmount).toFixed(2)}`}
                            </span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Final Price</span>
                            <span className="font-medium text-green-600">
                              ${Number(product.finalPrice).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sales" className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium mb-4">Sales Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-2xl font-bold">{product.sales}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-2xl font-bold">
                      ${(parseFloat(product.price.replace('$', '')) * product.sales).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Avg. Price</p>
                    <p className="text-2xl font-bold">{product.price}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Slug editing section */}
          <div className="mb-6 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">URL Slug</h3>
            
            {isEditingSlug ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">/products/</span>
                  <Input
                    value={slugValue}
                    onChange={(e) => setSlugValue(e.target.value)}
                    className="flex-1"
                    placeholder="product-name-123"
                  />
                </div>
                
                <div className="text-xs text-gray-500 mb-2">
                  Use only lowercase letters, numbers, and hyphens. No spaces or special characters.
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSlugUpdate}>Save</Button>
                  <Button size="sm" variant="outline" onClick={regenerateSlug}>
                    Auto-Generate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingSlug(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <span className="font-mono bg-gray-100 p-1 rounded text-gray-700">
                    /products/{product.slug}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsEditingSlug(true)}>
                  Edit URL
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-1 space-y-6">
          {/* Quick stats */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-medium mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Views</p>
                <p className="text-lg font-medium">0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-lg font-medium">0%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg font-medium">
                  ${(parseFloat(product.price.replace('$', '')) * product.sales).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-medium mb-4">Actions</h3>
            <div className="space-y-2">
              <Button className="w-full">View Analytics</Button>
              <Button variant="outline" className="w-full">Download Report</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 