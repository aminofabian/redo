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
import { type ProductWithImages } from "@/types/db";
import Hero from "./ui/Hero";

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
  initialProducts: ProductWithImages[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  // Let's use direct string comparison for reliability - this is "44487"
  const CORRECT_PASSWORD = "44487";
  
  // Check if already authenticated from localStorage with expiration
  useEffect(() => {
    const authData = localStorage.getItem("site_auth");
    if (authData) {
      try {
        const { expiry, authenticated } = JSON.parse(authData);
        if (authenticated && new Date(expiry) > new Date()) {
          setIsAuthenticated(true);
        } else {
          // Clear expired authentication
          localStorage.removeItem("site_auth");
        }
      } catch (e) {
        localStorage.removeItem("site_auth");
      }
    }
    
    // Clear any old auth format
    localStorage.removeItem("maintenance_auth");
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Use direct string comparison instead of hashing
      if (password === CORRECT_PASSWORD) {
        // Set authentication with 24-hour expiry
        const authData = {
          authenticated: true,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem("site_auth", JSON.stringify(authData));
        setIsAuthenticated(true);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          setError("Too many failed attempts. Please try again later.");
          // Add a delay for security
          setTimeout(() => setAttempts(0), 30000);
        } else {
          setError(`Invalid password. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
            <Hero />
          </Suspense>
          
          {/* Product Categories Bar - New Addition */}
          <div className="bg-gray-100 py-4 mb-8">
            <div className="container mx-auto px-4">
              <div className="flex justify-center space-x-8 overflow-x-auto">
                <a href="#" className="whitespace-nowrap px-4 py-2 font-medium hover:text-blue-600">New Arrivals</a>
                <a href="#" className="whitespace-nowrap px-4 py-2 font-medium hover:text-blue-600">Best Sellers</a>
                <a href="#" className="whitespace-nowrap px-4 py-2 font-medium hover:text-blue-600">Study Guides</a>
                <a href="#" className="whitespace-nowrap px-4 py-2 font-medium hover:text-blue-600">Clinical Resources</a>
                <a href="#" className="whitespace-nowrap px-4 py-2 font-medium hover:text-blue-600">NCLEX Prep</a>
                <a href="#" className="whitespace-nowrap px-4 py-2 font-medium hover:text-blue-600">Special Offers</a>
              </div>
            </div>
          </div>
          
          {/* Featured Products Section - Moved up */}
          <section className="container mx-auto px-4 mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
            <Suspense fallback={<div>Loading...</div>}>
              {/* @ts-ignore - Products will be passed from parent */}
              <FeaturedResourcesWrapper products={initialProducts} />
            </Suspense>
          </section>
          
          {/* Categories */}
          <section className="mb-12">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">Shop by Category</h2>
              <CategoryShowcase />
            </div>
          </section>
          
          {/* Popular Products Section */}
          <DiscoverNursing products={initialProducts.filter(p => p.featured)} />
          
          {/* Benefits/Features Section */}
          <section className="bg-gray-50 py-12 mb-12">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">Why Shop With Us</h2>
              <Features />
            </div>
          </section>
          
          <BlogSection />
          <FindBestResources />
          <FAQ />
          <Footer />
        </main>
        <WhatsAppButton />
        <FloatingButtons />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          {/* Logo placeholder - replace with your actual logo */}
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">RN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">RN Student Resources</h1>
          <p className="mt-2 text-gray-600">This site is protected. Please enter the access code.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Access Code
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={attempts >= 5}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading || attempts >= 5}
              className="w-full px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : "Access Site"}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>If you need assistance accessing the site, please contact support.</p>
          </div>
        </form>
      </div>
    </div>
  );
} 