"use client";

import { motion } from "framer-motion";
import React from "react";
import { Sparkles } from "lucide-react";
import SearchFilter from "../SearchFilter";
import Testimonials from "./Testimonials";
import EnhancedStats from "./EnhancedStats";
import TriggerSection from "./TriggerSection";
import UniversitySlider from "./UniversitySlider";
import { nursingSchools } from "./data";

const Hero = () => {
  return (
    <div className="relative bg-white overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl -z-10" />
      
      {/* Main content with improved spacing */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 w-full">
        {/* University Slider area - keeping space for it */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12 max-w-5xl mx-auto"
        >
          <div className="text-center">
            {/* Content placeholder */}
          </div>
        </motion.div>

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
                <SearchFilter universities={nursingSchools} />
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