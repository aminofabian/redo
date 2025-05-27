"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, GraduationCap } from "lucide-react";
import SearchFilter from "../SearchFilter";
import Testimonials from "./Testimonials";
import EnhancedStats from "./EnhancedStats";
import TriggerSection from "./TriggerSection";
import UniversitySlider from "./UniversitySlider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// No hardcoded universities - extract exclusively from the database

const Hero = () => {
  const router = useRouter();
  const [universities, setUniversities] = useState<string[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch universities exclusively from the database
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        // Fetch universities from multiple API endpoints for maximum coverage
        const [uniResponse, categoriesResponse] = await Promise.all([
          fetch('/api/universities'),
          fetch('/api/categories')
        ]);
        
        if (!uniResponse.ok) throw new Error('Failed to fetch universities');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        
        const uniData = await uniResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        // Use a Set to store unique university values
        const universitySet = new Set<string>();
        
        // 1. Process universities from CategoryPath - the primary source
        uniData.forEach((uni: any) => {
          if (uni && uni.level1 === 'university' && uni.level2) {
            universitySet.add(uni.level2);
          }
        });
        
        // 2. Process universities from path patterns
        uniData.forEach((uni: any) => {
          if (uni && uni.path && uni.path.includes('university/')) {
            const pathParts = uni.path.split('/');
            for (let i = 0; i < pathParts.length; i++) {
              if (pathParts[i] === 'university' && i + 1 < pathParts.length) {
                universitySet.add(pathParts[i + 1]);
              }
            }
          }
        });
        
        // 3. Extract from categories that have university in their name or path
        const extractUniversityFromCategories = (categories: any[]) => {
          categories.forEach(cat => {
            // Check if name contains university
            if (cat.name && cat.name.toLowerCase().includes('university')) {
              // Convert name to slug format
              const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
              universitySet.add(slug);
            }
            
            // Check path patterns
            if (cat.path && cat.path.includes('university/')) {
              const pathParts = cat.path.split('/');
              for (let i = 0; i < pathParts.length; i++) {
                if (pathParts[i] === 'university' && i + 1 < pathParts.length) {
                  universitySet.add(pathParts[i + 1]);
                }
              }
            }
            
            // Recursively process children
            if (cat.children && Array.isArray(cat.children)) {
              extractUniversityFromCategories(cat.children);
            }
          });
        };
        
        extractUniversityFromCategories(categoriesData);
        
        // Convert to array and sort alphabetically - keep the exact database format
        const formattedUniversities = Array.from(universitySet).sort();
        
        console.log(`Found ${formattedUniversities.length} universities from database`);
        setUniversities(formattedUniversities);
      } catch (error) {
        console.error('Error fetching universities:', error);
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl -z-10" />
      
      {/* Main content with improved spacing */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 w-full">
        {/* University filter removed as requested */}

        <div className="text-center mb-16 sm:mb-20 relative">
          {/* Enhanced glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-600/10 rounded-full blur-3xl" />

          {/* Badge with enhanced styling */}
          <motion.span 
            className="inline-flex items-center px-4 py-1.5 bg-yellow-50 border border-yellow-200/50 rounded-full text-xs font-medium text-green-700 mb-5 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
            #1 Nursing Education Platform
          </motion.span>

          {/* Improved heading with better typography */}
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight relative leading-tight max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Master Your <span className="text-green-600 relative">
              Nursing Journey
              <div className="absolute -bottom-1.5 left-0 w-full h-1 bg-yellow-400 rounded-full"></div>
            </span>
            <span className="block mt-2">With Confidence</span>
          </motion.h1>

          {/* Enhanced subheading */}
          <motion.p 
            className="text-base sm:text-lg text-gray-600 mb-10 max-w-2xl mx-auto relative px-4 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join over <span className="font-bold text-green-600">50,000+</span> nursing students achieving success with our comprehensive study materials
          </motion.p>

          {/* Improved search filter container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-4xl mx-auto relative z-10"
          >
            <div className="absolute inset-0 bg-green-100 rounded-xl blur-xl -z-10 transform scale-105"></div>
            <div className="p-0.5 bg-yellow-200 rounded-xl">
              <div className="bg-white rounded-xl shadow-md">
                <SearchFilter 
                  universities={universities} 
                  selectedUniversity={selectedUniversity}
                  initialSearchQuery={searchQuery}
                  onUniversityChange={(university) => {
                    setSelectedUniversity(university);
                    // Redirect to products page with university filter and preserve search query
                    if (university) {
                      const params = new URLSearchParams();
                      params.set('university', university);
                      params.set('page', '1');
                      if (searchQuery) params.set('q', searchQuery);
                      router.push(`/products?${params.toString()}`);
                    }
                  }}
                  onSearchChange={(query: string) => setSearchQuery(query)}
                  onSearchSubmit={(query: string) => {
                    // Redirect to products page with search query and university filter
                    const params = new URLSearchParams();
                    if (query) params.set('q', query);
                    if (selectedUniversity) params.set('university', selectedUniversity);
                    params.set('page', '1');
                    router.push(`/products?${params.toString()}`);
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced triggers section with consistent styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TriggerSection />
        </motion.div>
      </div>
    </div>
  );
};

export default Hero; 