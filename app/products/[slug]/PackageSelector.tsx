'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from '@/lib/CartContext';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

interface PackageSelectorProps {
  product: {
    id: number;
    title: string;
    price: number;
    finalPrice: number;
  };
}

export default function PackageSelector({ product }: PackageSelectorProps) {
  const { currentPackage, startPackage, completePackage, cancelPackage, addItem } = useCart();
  const [showPackageOptions, setShowPackageOptions] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const packageOptions = [3, 5, 10];
  const router = useRouter();

  // If there's an active package being built
  if (currentPackage.size) {
    const remaining = currentPackage.size - currentPackage.items.length;
    return (
      <div className="space-y-3">
        <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300 shadow-md">
          <div className="flex items-center mb-2">
            <div className="w-1 h-8 bg-yellow-500 rounded-sm mr-2"></div>
            <h3 className="font-bold text-base text-yellow-800">
              Building {currentPackage.size}-Item Bundle
            </h3>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm mb-3 border border-yellow-200">
            <p className="font-semibold text-base mb-2">
              {remaining === 0 
                ? "✅ Bundle complete! Ready for checkout." 
                : `${remaining} more ${remaining === 1 ? 'item' : 'items'} needed to complete your bundle`}
            </p>
            
            {currentPackage.items.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-sm text-gray-700 border-b pb-1 mb-1">Items in your bundle:</p>
                <ul className="flex flex-wrap gap-1">
                  {currentPackage.items.map(item => (
                    <li key={item.id} className="flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-100 text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                      <span className="font-medium truncate max-w-[120px]">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {remaining === 0 ? (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  completePackage();
                  toast.success("Bundle added to cart!");
                  router.push('/cart');
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Complete Bundle & Checkout
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  router.push('/products');
                }}
                className="flex-1 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-2 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Browse More Items
              </Button>
            )}
            <Button
              variant="outline"
              onClick={cancelPackage}
              className="border-2 border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Cancel Bundle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSinglePurchase = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.finalPrice,
    });
    toast.success(`Added "${product.title}" to cart`);
  };

  const handlePackageStart = (size: number) => {
    startPackage(size);
    toast.success(
      `Started ${size}-item package. Add ${size} items to get 15% off!`,
      {
        action: {
          label: "Browse Items",
          onClick: () => router.push('/products')
        }
      }
    );
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={handleSinglePurchase}
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
      >
        <ShoppingCart className="mr-2 h-5 w-5 text-white" />
        Add to Cart - ${product.finalPrice.toFixed(2)}
      </Button>
      
      <div className="mt-4">
        <Button 
          variant="outline" 
          onClick={() => setShowPackageOptions(!showPackageOptions)}
          className="w-full flex items-center justify-between border-2 border-green-600 text-green-700 bg-green-50 hover:bg-green-100 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-20 h-20 bg-green-600 rotate-45 z-0"></div>
          <span className="flex items-center z-10">
            <Package className="mr-2 h-5 w-5" />
            <span className="font-semibold">BUNDLE DEAL - SAVE 15%</span>
          </span>
          <span className="z-10 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
            {showPackageOptions ? <Minus size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
            {showPackageOptions ? "Hide Options" : "Show Options"}
          </span>
        </Button>
        
        {showPackageOptions && (
          <div className="mt-2 space-y-2 bg-green-50 p-3 rounded-lg border-2 border-green-200 shadow-inner animate-fadeIn">
            <div className="flex flex-row items-center gap-2 mb-2 bg-white p-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium text-gray-700">Qty:</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center font-bold border focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="ml-auto text-xs rounded-lg">
                <span className="font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">15% OFF</span>
              </div>
            </div>
            
            <div className="bg-white p-2 rounded-lg shadow-sm mb-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-1 border-l-2 border-green-500 pl-2">Select Bundle Size:</h3>
              <div className="space-y-1">
                {packageOptions.map((size) => (
                  <Button
                    key={size}
                    variant="outline"
                    onClick={() => handlePackageStart(size)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-green-100 bg-white border border-green-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <span className="flex items-center">
                      <Package className="h-5 w-5 mr-2 text-green-600" />
                      <span className="font-semibold">{size}-Item Bundle</span>
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="line-through text-gray-500 text-xs">${(product.finalPrice * size).toFixed(2)}</span>
                      <span className="font-bold text-green-700 text-lg">
                        ${(product.finalPrice * size * 0.25).toFixed(2)}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 