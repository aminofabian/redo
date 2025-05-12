'use client';
import { useState } from 'react';
import { Toaster } from "sonner";
import { CartSidebar } from "@/components/ui/CartSidebar";
import PackageSelector from './PackageSelector';
import { AddToPackageButton } from './AddToPackageButton';

interface ProductInteractionsProps {
  product: any; // Replace with more specific type if available
}

interface CartSidebarWithToasterProps {
  priceId: string;
  price: string; // Price is expected to be a string in the CartSidebar component
  description: string;
}

export function ProductInteractions({ product }: ProductInteractionsProps) {
  return (
    <div className="space-y-3">
      <PackageSelector product={product} />
      <AddToPackageButton product={product} />
    </div>
  );
}

export function CartSidebarWithToaster({ priceId, price, description }: CartSidebarWithToasterProps) {
  return (
    <>
      <CartSidebar 
        priceId={priceId}
        price={price}
        description={description}
      />
      <Toaster position="bottom-right" />
    </>
  );
} 