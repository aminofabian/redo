'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CartSidebar() {
  const { items, removeItem, totalItems, totalPrice } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);

  if (items.length === 0) return null;

  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="font-bold text-lg">Cart Summary</h2>
        </div>
        <span className="text-sm text-gray-500">({totalItems} items)</span>
      </div>
      
      <div className="space-y-3 mb-4 max-h-[300px] overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="border-b pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1">
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
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <p className="text-sm text-gray-600">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Package Items */}
            {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
              <div className="mt-2 ml-6 space-y-1 text-sm text-gray-600">
                <p className="font-medium text-xs text-gray-500 mb-1">Package Items:</p>
                {item.packageItems.map((packageItem, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{packageItem.title}</span>
                    <span>${packageItem.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="text-xs text-green-600 font-medium pt-1">
                  75% Package Savings Applied
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between font-medium text-lg mb-4">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <Button className="w-full">
          Proceed to Checkout ({totalItems} items)
        </Button>
      </div>
    </div>
  );
} 