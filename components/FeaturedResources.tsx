"use client";

import { Product } from '@/types';
import NursingResourcesSection from "./ui/NursingResources";

export default function FeaturedResources({ products }: { products: Product[] }) {
  return <NursingResourcesSection products={products} />;
} 