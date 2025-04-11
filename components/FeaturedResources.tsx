"use client";

import type { Product, ProductImage } from '.prisma/client';
import NursingResourcesSection from "./ui/NursingResources";

export default function FeaturedResources({ 
  products 
}: { 
  products: (Product & { images: ProductImage[] })[] 
}) {
  return <NursingResourcesSection products={products} />;
} 