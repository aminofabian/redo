"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "./button";
import { ArrowRight, Download, ShieldCheck, HeadphonesIcon, ThumbsUp, PiggyBank, Sparkles, GraduationCap } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";

// Hardcoded nursing schools data
const nursingSchools = [
  {
    id: "1",
    name: "Arizona College of Nursing",
    imagePath: "/nursing/Arizona College of Nursing.png"
  },
  {
    id: "2",
    name: "Chamberlain University",
    imagePath: "/nursing/Chamberlain University.png"
  },
  {
    id: "3",
    name: "Columbia School of Nursing",
    imagePath: "/nursing/Columbia School of Nursing.png"
  },
  {
    id: "4",
    name: "Georgia College and State University",
    imagePath: "/nursing/Georgia College and State University.png"
  },
  {
    id: "5",
    name: "Ohio State University",
    imagePath: "/nursing/Ihio State University.png"
  },
  {
    id: "6",
    name: "Langston University",
    imagePath: "/nursing/Langston University.png"
  },
  {
    id: "7",
    name: "Southeast Missouri State University",
    imagePath: "/nursing/Southeast Missouri State University.png"
  },
  {
    id: "8",
    name: "The University of Iowa",
    imagePath: "/nursing/The University of Iowa.png"
  },
  {
    id: "9",
    name: "University of Maryland",
    imagePath: "/nursing/Univeristy of Maryland.png"
  },
  {
    id: "10",
    name: "University of South Alabama",
    imagePath: "/nursing/University_of_South_Alabama_logo.png"
  }
];

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

const testimonials = [
  {
    quote: "This platform helped me pass my NCLEX on the first try!",
    author: "Sarah K., BSN Graduate",
    school: "University of Maryland"
  },
  {
    quote: "The practice questions are exactly what I needed for my exams.",
    author: "Michael T., Nursing Student",
    school: "Chamberlain University"
  },
  {
    quote: "Worth every penny for the confidence it gave me.",
    author: "Jessica L., RN",
    school: "Ohio State University"
  }
];

// Updated Hero component with enhanced visual elements
const Hero = () => {
  // Reference for the slider container
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
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
  
  // Auto rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Animation variants for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };
  
  return (
    <div className="relative flex items-center bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-black/[0.01] -z-10" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-[#5d8e9a]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#5d8e9a]/10 rounded-full blur-3xl -z-10" />
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 w-full">
        <div className="text-center mb-12 sm:mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#5d8e9a]/20 rounded-full blur-3xl" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <span className="inline-flex items-center px-4 py-1.5 bg-[#5d8e9a]/20 rounded-full text-xs sm:text-sm font-medium text-[#5d8e9a] mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              #1 Nursing Education Platform
            </span>
          </motion.div>

          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight relative leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Master Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5d8e9a] to-[#3a6b79]">Nursing Journey</span>
            <span className="block mt-2">With Confidence</span>
          </motion.h1>

          <motion.p 
            className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto relative px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Join over <span className="font-bold text-[#5d8e9a]">50,000+</span> nursing students who&apos;ve achieved their goals with our comprehensive study materials and practice tests
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#5d8e9a] to-[#3a6b79] hover:from-[#4d7e8a] hover:to-[#2a5b69] shadow-lg hover:shadow-xl transition-all duration-300 text-white font-medium py-6">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto mt-3 sm:mt-0 border-[#5d8e9a] text-[#5d8e9a] hover:bg-[#537f8a]/5 py-6 font-medium">
              <GraduationCap className="mr-2 h-5 w-5" />
              Explore Resources
            </Button>
          </motion.div>
        </div>

        {/* Featured testimonial */}
        <motion.div
          className="w-full mb-14 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="max-w-3xl mx-auto px-6 py-8 bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#5d8e9a]/5 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#5d8e9a]/5 rounded-full -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative h-28">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: activeTestimonial === index ? 1 : 0,
                    y: activeTestimonial === index ? 0 : 20,
                    pointerEvents: activeTestimonial === index ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-gray-700 text-lg italic mb-3 font-light">"{testimonial.quote}"</p>
                  <p className="text-[#5d8e9a] font-medium text-sm">{testimonial.author} • {testimonial.school}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeTestimonial === index ? 'bg-[#5d8e9a] w-6' : 'bg-gray-300'
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced slider with clean background */}
        <motion.div 
          className="w-full mb-14 overflow-hidden relative rounded-xl bg-white p-8 shadow-md border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center flex items-center justify-center">
            <span className="inline-block pb-2 border-b-2 border-[#5d8e9a] flex items-center">
              <GraduationCap className="mr-2 h-5 w-5 text-[#5d8e9a]" />
              Featured Nursing Schools
            </span>
          </h2>
          
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex space-x-6 slider-content pl-2">
              {nursingSchools.map((school) => (
                <motion.div
                  key={school.id}
                  className="shrink-0 w-[220px] md:w-[240px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer border border-gray-100 relative group"
                  whileHover={{ y: -8, scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4,
                    type: "spring",
                    stiffness: 150,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#5d8e9a]/0 to-[#5d8e9a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-5 h-[120px] flex items-center justify-center bg-white">
                    <Image
                      src={school.imagePath}
                      alt={school.name}
                      width={140}
                      height={100}
                      className="object-contain w-[140px] h-[100px] group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-category.jpg'
                      }}
                    />
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-100 h-[50px] flex items-center justify-center group-hover:bg-[#5d8e9a]/10 transition-colors duration-500">
                    <h3 className="text-sm font-semibold text-gray-800 text-center truncate w-full">
                      {school.name}
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

        {/* Enhanced triggers section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-2"
        >
          {triggers.map((trigger) => (
            <motion.div
              key={trigger.text}
              variants={item}
              className="flex items-center justify-center gap-4 bg-white px-6 py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-500 border border-gray-100 hover:border-[#5d8e9a]/30 group"
              whileHover={{ y: -5, backgroundColor: 'rgba(93, 142, 154, 0.05)' }}
            >
              <span className="text-[#5d8e9a] bg-[#5d8e9a]/10 p-3 rounded-lg group-hover:bg-[#5d8e9a]/20 transition-colors duration-300">
                {trigger.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#5d8e9a] transition-colors duration-300">
                {trigger.text}
              </span>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Enhanced stats */}
        <motion.div 
          className="mt-12 text-center bg-gradient-to-r from-[#5d8e9a]/10 to-[#3a6b79]/10 py-8 px-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Impact on Nursing Education</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-3xl font-bold text-[#5d8e9a]">200+</p>
              <p className="text-gray-600 text-sm">Nursing Programs</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-3xl font-bold text-[#5d8e9a]">50,000+</p>
              <p className="text-gray-600 text-sm">Students Enrolled</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-3xl font-bold text-[#5d8e9a]">95%</p>
              <p className="text-gray-600 text-sm">Pass Rate Improvement</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero; 