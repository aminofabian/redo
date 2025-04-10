"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "./button";
import { ArrowRight, Download, ShieldCheck, HeadphonesIcon, ThumbsUp, PiggyBank } from "lucide-react";

// Define the type for category items
interface CategoryItem {
  id?: string;
  title: string;
  image: string;
  students: string;
  rating: number;
  tag?: string;
  resourceCount?: number;
  averagePrice?: string;
}

// No more hardcoded categories - only placeholder logic
const generatePlaceholderCategories = (): CategoryItem[] => {
  const categoryNames = ["NCLEX-RN", "Med-Surg", "Critical Care", "Pediatrics", "OB/GYN", "Mental Health", "Fundamentals"];
  const imagePaths = [
    "/categories/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg",
    "/categories/hush-naidoo-jade-photography-eKNswc0Qxz8-unsplash.jpg",
    "/categories/owen-beard-DK8jXx1B-1c-unsplash.jpg",
    "/categories/tony-luginsland-qS1bDAxxAYg-unsplash.jpg",
    "/categories/paul-felberbauer-QL7iY3G24z4-unsplash.jpg",
    "/categories/robina-weermeijer-NIuGLCC7q54-unsplash.jpg",
    "/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg"
  ];
  
  // Generate placeholder items with realistic resource counts and prices
  return categoryNames.map((name, index) => {
    const resourceCount = Math.floor(Math.random() * 10) + 1;
    const basePrice = 30 + Math.floor(Math.random() * 70);
    
    return {
      id: index.toString(),
      title: name,
      image: imagePaths[index],
      students: `${Math.floor(Math.random() * 10) + 2}K+`,
      rating: 4.5 + Math.random() * 0.4,
      tag: index === 0 ? "Most Popular" : undefined,
      resourceCount,
      averagePrice: basePrice.toFixed(2)
    };
  });
};

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

// Update Hero component to generate placeholders on-demand
const Hero = ({ categories }: { categories?: CategoryItem[] }) => {
  console.log("HERO: Component rendering");
  console.log(`HERO: Received ${categories?.length || 0} categories from parent`);
  
  if (categories && categories.length > 0) {
    console.log("HERO: Using database categories:", categories.map(c => c.title));
  } else {
    console.log("HERO: No categories from database, using placeholders");
  }
  
  // Only generate placeholders if no categories are provided or array is empty
  const items = (categories && categories.length > 0) 
    ? categories 
    : generatePlaceholderCategories();
  
  console.log("HERO: Final categories being displayed:", items.map(c => c.title));

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
          {items.map((item, index) => (
            <motion.div
              key={`${item.id || index}-${item.title}`}
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
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {item.tag && (
                    <span className="px-2 py-1 bg-[#5d8e9a] text-white text-[10px] font-medium rounded-full">
                      {item.tag}
                    </span>
                  )}
                  {item.resourceCount !== undefined && item.resourceCount > 5 && !item.tag && (
                    <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-medium rounded-full">
                      Popular
                    </span>
                  )}
                  {item.resourceCount === 0 && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-medium rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <div className="absolute top-2 left-2">
                  {Array.from({ length: Math.min(item.resourceCount || 0, 5) }).map((_, i) => (
                    <div 
                      key={i}
                      className="w-2 h-2 bg-white rounded-full mb-1 opacity-80"
                      style={{ transform: `translateX(${i * 2}px)` }}
                    />
                  ))}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-semibold text-white mb-1 flex items-center">
                    {item.title}
                    {(item.resourceCount ?? 0) > 10 && (
                      <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                    )}
                  </h3>
                  
                  <div className="text-[10px] text-white/90">
                    <div className="flex items-center">
                      <span>{item.resourceCount || 0} Resource{item.resourceCount !== 1 ? 's' : ''}</span>
                      
                      <div className="ml-1 flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#5d8e9a]" 
                          style={{ width: `${Math.min((item.resourceCount || 0) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {item.averagePrice && (
                      <div className="mt-1 flex justify-between items-center">
                        <span>Avg. ${item.averagePrice}</span>
                        <span className="text-[9px] opacity-80">
                          {parseFloat(item.averagePrice) < 50 ? 'Budget' : 
                           parseFloat(item.averagePrice) < 80 ? 'Standard' : 'Premium'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-center p-3">
                  <p className="text-white font-medium mb-2">{item.title}</p>
                  <p className="text-[10px] text-white/80 mb-1">{item.resourceCount || 0} resources available</p>
                  {item.averagePrice && (
                    <p className="text-[10px] text-white/80">Average price: ${item.averagePrice}</p>
                  )}
                  <button className="mt-2 text-[10px] px-3 py-1 bg-[#5d8e9a] text-white rounded-full">
                    Explore Category
                  </button>
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