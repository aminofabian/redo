"use client";
import { Product, ProductImage } from "@prisma/client";
import NursingproductsSection from "./ui/NursingResources";

interface Props {
  products: (Product & { images: ProductImage[] })[];
}

const FeaturedResourcesWrapper = ({ products }: Props) => {
  return <NursingproductsSection products={products} />;
};

export default FeaturedResourcesWrapper; 