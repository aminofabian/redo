'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Helper function to handle BigInt serialization
function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
}

// Helper function to handle BigInt parsing
function safeJSONParse(text: string): any {
  return JSON.parse(text, (key, value) => {
    // If this looks like a BigInt string that was stringified, convert it back
    if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
      try {
        return BigInt(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  });
}

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  finalPrice?: number;
  isPackage?: boolean;
  packageSize?: number;
  packageItems?: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
  currentPackage: {
    size: number | null;
    items: CartItem[];
  };
  startPackage: (size: number) => void;
  addToPackage: (item: Omit<CartItem, 'quantity'>) => void;
  completePackage: () => void;
  cancelPackage: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentPackage, setCurrentPackage] = useState<{size: number | null; items: CartItem[]}>({
    size: null,
    items: []
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        // Use safe parsing to handle potential BigInt values
        setItems(safeJSONParse(savedCart));
      } catch (error) {
        console.error('Error parsing cart:', error);
        // If there's an error, start with an empty cart
        setItems([]);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    try {
      // Use safe stringification to handle BigInt values
      localStorage.setItem('cart', safeJSONStringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
      // If serialization fails, let the user know
      toast.error('Failed to save cart');
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => 
        item.id === newItem.id && 
        item.isPackage === newItem.isPackage && 
        item.packageSize === newItem.packageSize
      );
      
      if (existingItem) {
        toast.error("Item already in cart");
        return currentItems;
      }
      console.log(...currentItems, { ...newItem, quantity: 1 }, 'what are you here fore...');
      
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => {
    setItems(items => items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    setItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const startPackage = (size: number) => {
    setCurrentPackage({ size, items: [] });
  };

  const addToPackage = (item: Omit<CartItem, 'quantity'>) => {
    if (!currentPackage.size) return;
    
    if (currentPackage.items.length >= currentPackage.size) {
      toast.error("Package is full");
      return;
    }

    if (currentPackage.items.some(i => i.id === item.id)) {
      toast.error("Item already in package");
      return;
    }

    setCurrentPackage(curr => ({
      ...curr,
      items: [...curr.items, { ...item, quantity: 1 }]
    }));
  };

  const completePackage = () => {
    if (currentPackage.items.length === currentPackage.size) {
      const totalPrice = currentPackage.items.reduce((sum, item) => sum + item.price, 0) * 0.25;
      addItem({
        id: Date.now(),
        title: `Package Deal (${currentPackage.size} items)`,
        price: totalPrice,
        isPackage: true,
        packageSize: currentPackage.size,
        packageItems: currentPackage.items
      });
      setCurrentPackage({ size: null, items: [] });
    }
  };

  const cancelPackage = () => {
    setCurrentPackage({ size: null, items: [] });
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      updateQuantity,
      totalItems,
      totalPrice,
      currentPackage,
      startPackage,
      addToPackage,
      completePackage,
      cancelPackage
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 