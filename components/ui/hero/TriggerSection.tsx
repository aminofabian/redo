"use client";

import { motion } from "framer-motion";
import React from "react";
import { triggers } from "./data";
import { 
  Download, ShieldCheck, HeadphonesIcon, 
  ThumbsUp, PiggyBank 
} from "lucide-react";

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "Download": return <Download className="w-5 h-5" />;
    case "ShieldCheck": return <ShieldCheck className="w-5 h-5" />;
    case "HeadphonesIcon": return <HeadphonesIcon className="w-5 h-5" />;
    case "ThumbsUp": return <ThumbsUp className="w-5 h-5" />;
    case "PiggyBank": return <PiggyBank className="w-5 h-5" />;
    default: return <Download className="w-5 h-5" />;
  }
};

const TriggerSection = () => {
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
            {getIcon(trigger.icon)}
          </span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-[#5d8e9a] transition-colors duration-300">
            {trigger.text}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TriggerSection; 