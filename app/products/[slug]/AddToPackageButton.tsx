'use client';

import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { toast } from "sonner";

interface AddToPackageButtonProps {
  product: {
    id: number;
    title: string;
    price: number;
    finalPrice: number;
  };
}

export function AddToPackageButton({ product }: AddToPackageButtonProps) {
  const { currentPackage, addToPackage } = useCart();

  if (!currentPackage.size) return null;

  const remainingItems = currentPackage.size - currentPackage.items.length;

  return (
    <Button
      variant="outline"
      className="w-full mt-2"
      onClick={() => {
        addToPackage({
          id: product.id,
          title: product.title,
          price: product.finalPrice
        });
        toast.success(`Added to ${currentPackage.size}-item package`);
      }}
    >
      <Package className="mr-2 h-4 w-4" />
      Add to Package ({remainingItems} more needed)
    </Button>
  );
} 