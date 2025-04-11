'use client';

import { ShoppingBag } from "lucide-react";
import { Button } from "./button";
import { useEffect, useState } from "react";

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

export function CartIndicator() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ShoppingBag className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 border">
          <div className="p-4">
            <h3 className="font-medium mb-2">Cart Items</h3>
            {items.length > 0 ? (
              <>
                <div className="space-y-2 mb-4 max-h-60 overflow-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="truncate flex-1">{item.title}</span>
                      <span className="text-gray-500 ml-2">×{item.quantity}</span>
                      <span className="ml-2 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-3">
                  Checkout ({totalItems} items)
                </Button>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Your cart is empty</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 