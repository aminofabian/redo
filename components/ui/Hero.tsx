"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "./button";
import { ArrowRight, Download, ShieldCheck, HeadphonesIcon, ThumbsUp, PiggyBank } from "lucide-react";
import React from "react";

// Update the interface to match CategoryPath structure
interface CategoryPathItem {
  id: string;
  path: string;
  level1?: string | null;
  level2?: string | null;
  level3?: string | null;
  level4?: string | null;
  level5?: string | null;
  product: {
    id: number;
    title: string;
    price: number;
  };
}

const triggers = [
  {
    icon: <Download className="w-5 h-5" />,
    text: "Instant Downloads"
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    text: "Secure Checkout"
  },
  {
    icon: <HeadphonesIcon className="w-5 h-5" />,
    text: "24/7 Support"
  },
  {
    icon: <ThumbsUp className="w-5 h-5" />,
    text: "100% Satisfaction Guarantee"
  },
  {
    icon: <PiggyBank className="w-5 h-5" />,
    text: "Student-Friendly Prices"
  }
];

// Update the Hero component to use CategoryPath
const Hero = ({ categoryPaths = [] }: { categoryPaths?: CategoryPathItem[] }) => {
  console.log("HERO: Component rendering");
  console.log(`HERO: Received ${categoryPaths?.length || 0} category paths from parent`);

  if (categoryPaths.length > 0) {
    console.log("HERO: Using category paths:", categoryPaths.map(p => p.level2 || 'University'));
  } else {
    console.log("HERO: No categories available, using placeholders");
  }
  
  return (
    <div className="relative min-h-[600px] flex items-center bg-gradient-to-br from-[#5d8e9a]/10 via-white to-[#4a7280]/10">
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,44,81,0.1),rgba(255,255,255,0))]" />
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16 w-full">
        <div className="text-center mb-8 sm:mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#5d8e9a]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#5d8e9a]/20 rounded-full blur-2xl" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <span className="inline-block px-4 py-1.5 bg-[#5d8e9a]/20 rounded-full text-xs sm:text-sm font-medium text-[#5d8e9a] mb-4">
              #1 Nursing Education Platform
            </span>
          </motion.div>

          <motion.h1 
            className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Master Your Nursing Journey
            <span className="block text-[#5d8e9a]">With Confidence</span>
          </motion.h1>

          <motion.p 
            className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto relative px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Join over <span className="font-semibold text-[#5d8e9a]">50,000+</span> nursing students who&apos;ve achieved their goals with our comprehensive study materials and practice tests
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" className="w-full sm:w-auto bg-[#5d8e9a] hover:bg-[#537f8a] shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0 border-[#5d8e9a] text-[#5d8e9a] hover:bg-[#537f8a]/5">
              View Courses
            </Button>
          </motion.div>
        </div>

        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 w-full mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {categoryPaths.map((path, index) => (
            <motion.div
              key={path.id}
              className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 + (index * 5) }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3 + (index * 0.1),
                type: "spring",
                stiffness: 200,
                hover: { duration: 0.2, type: "tween" }
              }}
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src={`/universities/${path.level2?.toLowerCase()}.jpg` || '/images/default-category.jpg'}
                  alt={path.level2 || 'University'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 14vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to default image if university image not found
                    (e.target as HTMLImageElement).src = '/images/default-category.jpg'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-semibold text-white mb-1 flex items-center">
                    {path.level2 || 'University'}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {triggers.map((trigger) => (
            <motion.div
              key={trigger.text}
              className="flex items-center justify-center gap-3 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.9)" }}
            >
              <span className="text-[#5d8e9a] bg-[#5d8e9a]/20 p-2 rounded-lg">
                {trigger.icon}
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {trigger.text}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Hero; 