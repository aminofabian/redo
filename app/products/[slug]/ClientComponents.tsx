'use client';
import { useState } from 'react';
import { Toaster } from "sonner";
import { CartSidebar } from "@/components/ui/CartSidebar";
import PackageSelector from './PackageSelector';
import { AddToPackageButton } from './AddToPackageButton';

export function ProductInteractions({ product }) {
  return (
    <div className="space-y-3">
      <PackageSelector product={product} />
      <AddToPackageButton product={product} />
    </div>
  );
}

export function CartSidebarWithToaster({ priceId, price, description }) {
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