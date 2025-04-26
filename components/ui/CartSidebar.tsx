'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type PaymentGateway = {
  id: string;
  name: string;
  isActive: boolean;
  environment: string;
  businessName: string | null;
  supportsCreditCards: boolean;
  supportsDirectDebit: boolean;
};

export function CartSidebar() {
  const { items, removeItem, totalItems, totalPrice } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active payment gateways
  const fetchPaymentGateways = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment-gateways');
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data = await response.json();
      setPaymentGateways(data.gateways);
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  if (items.length === 0) return null;

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
        
        <Sheet onOpenChange={(open) => open && fetchPaymentGateways()}>
          <SheetTrigger asChild>
            <Button className="w-full">
              Proceed to Checkout ({totalItems} items)
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Select Payment Method</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : paymentGateways.length === 0 ? (
                <p className="text-center text-gray-500">No payment methods available</p>
              ) : (
                <div className="space-y-4">
                  {paymentGateways.map((gateway) => (
                    <div 
                      key={gateway.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        // Handle gateway selection
                        console.log(`Selected payment gateway: ${gateway.name}`);
                        // Will implement actual payment flow here
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{gateway.name}</h3>
                          {gateway.businessName && (
                            <p className="text-sm text-gray-500">
                              Powered by {gateway.businessName}
                            </p>
                          )}
                        </div>
                        <div className="text-sm">
                          {gateway.environment === 'test' && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              Test Mode
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500 flex gap-2">
                        {gateway.supportsCreditCards && (
                          <span className="bg-gray-100 px-2 py-1 rounded">Credit Card</span>
                        )}
                        {gateway.supportsDirectDebit && (
                          <span className="bg-gray-100 px-2 py-1 rounded">Direct Debit</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-6">
                    <div className="font-medium flex justify-between mb-2">
                      <span>Order Total:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 