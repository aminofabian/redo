"use client";

import { motion } from "framer-motion";
import React from "react";

const EnhancedStats = () => {
  return (
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
  );
};

export default EnhancedStats; 