'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Get discount rate based on package size (returns decimal, e.g., 0.10 for 10%)
export const getDiscountRate = (size: number | null): number => {
  if (!size) return 0;
  
  switch (size) {
    case 3: return 0.10; // 10% discount for 3 items
    case 5: return 0.15; // 15% discount for 5 items
    case 10: return 0.20; // 20% discount for 10 items
    default: return 0.10; // Default 10% discount for other sizes
  }
};

// Get discount percentage for display (returns percentage, e.g., 10 for 10%)
export const getDiscountPercentage = (size: number | null): number => {
  return getDiscountRate(size) * 100;
};

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
  type?: string; // Added for displaying the product type in the UI
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
  removeFromPackage: (id: number) => void;
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
      // Calculate the discounted price using the dynamic discount rate
      const discountRate = getDiscountRate(currentPackage.size);
      const originalTotal = currentPackage.items.reduce((sum, item) => sum + item.price, 0);
      const discountedTotal = originalTotal * (1 - discountRate);
      
      // Get percentage for display
      const discountPercentage = getDiscountPercentage(currentPackage.size);
      
      addItem({
        id: Date.now(),
        title: `Package Deal (${currentPackage.size} items - ${discountPercentage}% off)`,
        price: discountedTotal,
        isPackage: true,
        packageSize: currentPackage.size,
        packageItems: currentPackage.items
      });
      
      toast.success(`Bundle complete! ${discountPercentage}% discount applied`);
      setCurrentPackage({ size: null, items: [] });
    }
  };

  const cancelPackage = () => {
    setCurrentPackage({ size: null, items: [] });
  };

  const removeFromPackage = (id: number) => {
    setCurrentPackage(curr => ({
      ...curr,
      items: curr.items.filter(item => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id) : Number(item.id);
        return itemId !== id;
      })
    }));
    toast.success("Item removed from bundle");
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
      removeFromPackage,
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