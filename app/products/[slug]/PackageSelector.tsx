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
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-medium mb-2">
            Building {currentPackage.size}-Item Package
          </h3>
          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-2">
              {remaining === 0 
                ? "Package complete! Ready for checkout." 
                : `${remaining} more items needed to complete the package`}
            </p>
            {currentPackage.items.length > 0 && (
              <div className="bg-white p-2 rounded border border-gray-200">
                <p className="font-medium mb-1">Current items:</p>
                <ul className="list-disc ml-4">
                  {currentPackage.items.map(item => (
                    <li key={item.id}>{item.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {remaining === 0 ? (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  completePackage();
                  toast.success("Package added to cart!");
                  router.push('/cart');
                }}
              >
                Complete Package & Checkout
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  router.push('/products');
                }}
                className="flex-1"
              >
                Browse More Items
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={cancelPackage}
              className="text-red-600"
            >
              Cancel Package
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
      `Started ${size}-item package. Add ${size} items to get 75% off!`,
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
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart - ${product.finalPrice.toFixed(2)}
      </Button>
      
      <div>
        <Button 
          variant="outline" 
          onClick={() => setShowPackageOptions(!showPackageOptions)}
          className="w-full flex items-center justify-between border-green-600 text-green-700 hover:bg-green-50"
        >
          <span className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Buy Package (Save 75%)
          </span>
          {showPackageOptions ? <Minus size={16} /> : <Plus size={16} />}
        </Button>
        
        {showPackageOptions && (
          <div className="mt-2 space-y-2 bg-gray-50 p-3 rounded-md border">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-600">Quantity:</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
            </div>
            {packageOptions.map((size) => (
              <Button
                key={size}
                variant="outline"
                onClick={() => handlePackageStart(size)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-green-50"
              >
                <span>Start {size}-Item Package</span>
                <span className="font-bold text-green-700">
                  ${(product.finalPrice * size * 0.25).toFixed(2)}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 