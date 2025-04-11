"use client";
import type { Product, ProductImage } from "@/types";
import NursingproductsSection from "./ui/NursingResources";

interface Props {
  products: (Product & { images: ProductImage[] })[];
}

const FeaturedResourcesWrapper = ({ products }: Props) => {
  return <NursingproductsSection products={products} />;
};

export default FeaturedResourcesWrapper; 