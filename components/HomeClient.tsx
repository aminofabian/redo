"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from 'next/dynamic';
import Features from "@/components/ui/Features";
import DiscoverNursing from "@/components/ui/DiscoverNursing";
import FindBestResources from "@/components/ui/FindBestResources";
import BlogSection from "@/components/ui/BlogSection";
import FAQ from "@/components/ui/FAQ";
import Footer from "@/components/ui/Footer";
import MainNav from "@/components/navigation/MainNav";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import FloatingButtons from "@/components/ui/FloatingButtons";
import HeroWrapper from "@/components/HeroWrapper";
import { Product, ProductImage, CategoryProduct } from "@prisma/client";

// Dynamic imports for components that need client-only rendering
const FeaturedResourcesWrapper = dynamic(() => import('@/components/FeaturedResourcesWrapper'), {
  ssr: false,
  loading: () => <div className="w-full h-40 flex items-center justify-center">Loading featured resources...</div>
});

const CategoryShowcase = dynamic(() => import('@/components/CategoryShowcase'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-12">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-gray-600">Loading categories...</p>
      </div>
    </div>
  ),
});

interface HomeClientProps {
  initialProducts: (Product & { 
    images: ProductImage[];
    categories: (CategoryProduct & {
      category: { slug: string }
    })[];
  })[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // The password you'll use to access the site
  const SITE_PASSWORD = "3209";
  
  // Check if already authenticated from localStorage
  useEffect(() => {
    const auth = localStorage.getItem("maintenance_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === SITE_PASSWORD) {
      localStorage.setItem("maintenance_auth", "true");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password. Please try again.");
    }
  };
  
  if (isAuthenticated) {
    return (
      <div>
        <MainNav />
        <main className="pt-[90px]">
          <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>}>
            <HeroWrapper />
          </Suspense>
          <Features />
          <DiscoverNursing products={initialProducts.filter(p => p.featured)} />
          <CategoryShowcase />
          <Suspense fallback={<div>Loading...</div>}>
            {/* @ts-ignore - Products will be passed from parent */}
            <FeaturedResourcesWrapper products={initialProducts} />
          </Suspense>
          <BlogSection />
          <FAQ />
          <FindBestResources />
          <Footer />
        </main>
        <WhatsAppButton />
        <FloatingButtons />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen flex-col">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">RN Student Resources</h1>
          <p className="mt-2 text-gray-600">Enter password to access the site</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Access Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 