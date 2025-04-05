import { Metadata } from "next";
import ProductDetails from "./ProductDetails";

// Move this to a separate data file
const productDescriptions: Record<string, string> = {
  "nclex-rn-complete-prep-package": "Our comprehensive NCLEX-RN preparation package includes over 2000 practice questions, detailed explanations, and performance tracking. Perfect for nursing students preparing for their licensure examination.",
  "fundamentals-of-nursing-study-guide": "Master the core concepts of nursing with our comprehensive fundamentals guide. Covers patient care, clinical procedures, and essential nursing theory with real-world examples and case studies.",
  "specialized-medical-surgical-nursing-test-preparation": "Specialized Medical-Surgical nursing test preparation with focus on adult health nursing, critical thinking skills, and NCLEX-style questions. Includes detailed rationales and study strategies."
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `${params.id} | RN Student Resources`,
    description: productDescriptions[params.id] || "",
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails params={params} />;
} 