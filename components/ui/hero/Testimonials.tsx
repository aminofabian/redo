"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { testimonials } from "./data";

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // Auto rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
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
  );
};

export default Testimonials; 