'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight, Package, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to get started!</p>
          <Link href="/products">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            {items.map((item) => (
              <div key={item.id} className="p-4 border-b last:border-b-0">
                <div className="flex items-start gap-4">
                  {/* Item Image Placeholder */}
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                    {item.isPackage ? (
                      <Package className="h-8 w-8 text-gray-400" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.isPackage && (
                        <button 
                          onClick={() => togglePackage(item.id)}
                          className="p-0.5 hover:bg-gray-100 rounded"
                        >
                          {expandedPackages.includes(item.id) 
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                          }
                        </button>
                      )}
                      <h3 className="font-medium">{item.title}</h3>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Qty:</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <div className="text-lg font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 ml-auto"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Package Items */}
                    {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
                      <div className="mt-4 ml-4 space-y-2">
                        <p className="font-medium text-sm text-gray-500">Package Items:</p>
                        {item.packageItems.map((packageItem, index) => (
                          <div key={index} className="flex justify-between text-sm text-gray-600 border-t pt-2">
                            <span>{packageItem.title}</span>
                            <span>${packageItem.price.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="text-sm text-green-600 font-medium border-t pt-2">
                          75% Package Savings Applied
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({totalItems}):</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button className="w-full text-lg py-6" size="lg">
              Proceed to Checkout
            </Button>
            
            <div className="mt-4">
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 