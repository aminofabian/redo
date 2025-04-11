"use client";

import { Product } from '@prisma/client';
import NursingResourcesSection from "./ui/NursingResources";
import { ProductImage } from '@prisma/client';

export default function FeaturedResources({ 
  products 
}: { 
  products: (Product & { images: ProductImage[] })[] 
}) {
  return <NursingResourcesSection products={products} />;
} 