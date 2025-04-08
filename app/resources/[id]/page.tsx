import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import ProductDetails from "./ProductDetails";

// Move this to a separate data file
const productDescriptions: Record<string, string> = {
  "nclex-rn-complete-prep-package": "Our comprehensive NCLEX-RN preparation package includes over 2000 practice questions, detailed explanations, and performance tracking. Perfect for nursing students preparing for their licensure examination.",
  "fundamentals-of-nursing-study-guide": "Master the core concepts of nursing with our comprehensive fundamentals guide. Covers patient care, clinical procedures, and essential nursing theory with real-world examples and case studies.",
  "specialized-medical-surgical-nursing-test-preparation": "Specialized Medical-Surgical nursing test preparation with focus on adult health nursing, critical thinking skills, and NCLEX-style questions. Includes detailed rationales and study strategies."
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id }
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

export default async function Page({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
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
  
  // Transform product data for client component
  const productData = {
    id: product.id,
    title: product.title,
    description: product.description || "",
    price: Number(product.price),
    monthlyPrice: Math.round(Number(product.price) / 3),
    rating: calculateAverageRating(product.reviews),
    reviews: product.reviews.length,
    type: product.categories[0]?.category.name || "Study Resource",
    duration: product.accessDuration ? `${product.accessDuration} days` : "Lifetime",
    tags: product.categories.map(c => c.category.name),
    images: product.images.map(img => img.url),
    questions: product.description?.includes("questions") ? "2000+ Questions" : undefined,
    chapters: product.description?.includes("chapters") ? "15+ Chapters" : undefined
  };
  
  return <ProductDetails product={productData} />;
}

function calculateAverageRating(reviews: any[]) {
  if (reviews.length === 0) return "0.0";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
} 