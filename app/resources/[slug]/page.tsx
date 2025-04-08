import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import ProductDetails from "./ProductDetails";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug }
  });
  
  if (!product) {
    return {
      title: "Resource Not Found",
      description: "The requested resource could not be found."
    };
  }
  
  return {
    title: `${product.title} | RN Student Resources`,
    description: product.description || "",
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      categories: {
        include: {
          category: true
        }
      },
      reviews: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              image: true
            }
          }
        }
      }
    }
  });
  
  if (!product) {
    notFound();
  }
  
  // Make sure all data is serializable
  const productData = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description || "",
    price: Number(product.price),
    finalPrice: Number(product.finalPrice),
    discountPercent: product.discountPercent ? Number(product.discountPercent) : undefined,
    hasDiscount: Number(product.finalPrice) < Number(product.price),
    monthlyPrice: Math.round(Number(product.finalPrice) / 3),
    rating: calculateAverageRating(product.reviews),
    reviews: product.reviews.length,
    type: product.categories[0]?.category.name || "Study Resource",
    duration: product.accessDuration ? `${product.accessDuration} days` : "Lifetime",
    tags: product.categories.map(c => c.category.name),
    images: product.images.map(img => img.url),
    questions: product.description?.includes("questions") ? "2000+ Questions" : undefined,
    chapters: product.description?.includes("chapters") ? "15+ Chapters" : undefined,
    downloadLimit: product.downloadLimit ? Number(product.downloadLimit) : undefined,
    featured: Boolean(product.featured),
    viewCount: product.viewCount ? Number(product.viewCount) : 0
  };
  
  // Custom serializer that handles circular references
  function safeStringify(obj: any) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
  }
  
  const serializedData = JSON.parse(safeStringify(productData));
  
  return <ProductDetails product={serializedData} />;
}

function calculateAverageRating(reviews: any[]) {
  if (reviews.length === 0) return "0.0";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
} 