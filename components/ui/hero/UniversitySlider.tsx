"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// University data type
interface University {
  id: string;
  name: string;
  imagePath: string;
}

interface UniversitySliderProps {
  universities: University[];
}

const UniversitySlider: React.FC<UniversitySliderProps> = ({ universities }) => {
  const router = useRouter();
  // Reference for the slider container
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Handle university click to redirect to products page with filter
  const handleUniversityClick = (university: University) => {
    // Convert university name to slug format for URL if needed
    const slug = convertToSlug(university.name);
    // Redirect to products page with university filter
    router.push(`/products?page=1&university=${encodeURIComponent(slug)}`);
  };
  
  // Convert university name to slug format
  const convertToSlug = (name: string): string => {
    // If it already contains hyphens, assume it's already in slug format
    if (name.includes('-')) return name.toLowerCase();
    
    // Format university names to database format (e.g., "University of X" → "university-of-x")
    return name
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, ''); // Remove non-word chars except hyphens
  };
  
  // Auto-scrolling animation effect for schools
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    
    // Clone the slider content for infinite scrolling effect
    const sliderContent = slider.querySelector('.slider-content');
    if (sliderContent) {
      const clone = sliderContent.cloneNode(true);
      slider.appendChild(clone);
    }
    
    // Auto-scrolling animation
    let animationId: number;
    let scrollPosition = 0;
    
    const scroll = () => {
      if (!slider) return;
      
      scrollPosition += 0.5; // Adjust speed as needed
      
      // Reset position when scrolled through original content
      if (scrollPosition >= slider.scrollWidth / 2) {
        scrollPosition = 0;
        slider.scrollLeft = 0;
      } else {
        slider.scrollLeft = scrollPosition;
      }
      
      animationId = requestAnimationFrame(scroll);
    };
    
    // Start scrolling after a delay
    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(scroll);
    }, 2000);
    
    // Pause scrolling when hovering
    const pauseScroll = () => cancelAnimationFrame(animationId);
    const resumeScroll = () => animationId = requestAnimationFrame(scroll);
    
    slider.addEventListener('mouseenter', pauseScroll);
    slider.addEventListener('mouseleave', resumeScroll);
    
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationId);
      slider.removeEventListener('mouseenter', pauseScroll);
      slider.removeEventListener('mouseleave', resumeScroll);
    };
  }, []);

  return (
    <motion.div 
      className="w-full overflow-hidden relative rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div 
        ref={sliderRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex space-x-4 slider-content pl-2">
          {universities.map((university) => (
            <motion.div
              key={university.id}
              className="shrink-0 w-[160px] md:w-[180px] bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer border border-gray-100 relative group"
              whileHover={{ y: -5, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 150,
              }}
              onClick={() => handleUniversityClick(university)}
              aria-label={`View ${university.name} resources`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#5d8e9a]/0 to-[#5d8e9a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-3 h-[90px] flex items-center justify-center bg-white">
                <Image
                  src={university.imagePath}
                  alt={university.name}
                  width={100}
                  height={70}
                  className="object-contain w-[100px] h-[70px] group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-category.jpg'
                  }}
                />
              </div>
              <div className="p-2 bg-gray-50 border-t border-gray-100 h-[40px] flex items-center justify-center group-hover:bg-[#5d8e9a]/10 transition-colors duration-500">
                <h3 className="text-xs font-semibold text-gray-800 text-center truncate w-full">
                  {university.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Enhanced gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default UniversitySlider; 