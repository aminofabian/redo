"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";

const announcements = [
  {
    id: 1,
    text: "🎯 Special Launch Offer: 50% off all practice tests!",
    link: "/offers",
  },
  {
    id: 2,
    text: "🌟 New: Interactive study materials available",
    link: "/study",
  },
  {
    id: 3,
    text: "📚 Access 1000+ practice questions for free",
    link: "/practice",
  },
];

const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isVisible || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [isVisible, isPaused]);

  if (!isVisible) return null;

  const slideVariants = {
    enter: { x: "100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 }
  };

  const slideTransition = {
    duration: 0.6,
    ease: [0.22, 1, 0.36, 1]
  };

  return (
    <div 
      className="bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] h-10 relative overflow-hidden shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-dotted-h-white"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-dotted-h-white"></div>
        <div className="absolute top-0 left-4 h-full w-[1px] bg-dotted-v-white"></div>
        <div className="absolute top-0 right-4 h-full w-[1px] bg-dotted-v-white"></div>
        <div className="absolute top-0 left-1/3 h-full w-[1px] bg-dotted-v-white"></div>
        <div className="absolute top-0 right-1/3 h-full w-[1px] bg-dotted-v-white"></div>
      </div>
      
      <div className="relative h-full flex items-center justify-between max-w-7xl mx-auto px-5">
        <div className="relative z-10">
          <div className="absolute -left-1 -top-1 w-12 h-12 bg-white/5 rounded-full opacity-30"></div>
          <div className="bg-white/15 rounded-full border border-dashed border-white/30 p-1 flex items-center justify-center">
            <motion.div
              animate={{
                rotate: [0, 8, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 5
              }}
              className="shrink-0"
            >
              <Bell size={12} className="text-white" />
            </motion.div>
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center px-16">
          <div className="w-full overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentIndex}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex justify-center"
              >
                <div className="relative">
                  <Link 
                    href={announcements[currentIndex].link}
                    className="text-xs sm:text-sm font-medium tracking-wide text-white hover:underline inline-flex items-center gap-2 hover:gap-3 transition-all duration-300 text-center px-4 py-1"
                  >
                    <span className="relative">
                      {announcements[currentIndex].text}
                      <motion.div 
                        className="absolute -bottom-2 left-0 w-full h-[1px] bg-dotted-h-white opacity-60"
                        animate={{
                          width: ["0%", "100%"],
                          left: ["50%", "0%"],
                          right: ["50%", "0%"],
                        }}
                        transition={{
                          duration: 3,
                          ease: "easeOut",
                          delay: 1,
                        }}
                      />
                    </span>
                    <ChevronRight size={14} className="opacity-70" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pl-4 z-10">
          <div className="hidden sm:flex items-center gap-3">
            {announcements.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full border border-dashed ${
                  idx === currentIndex 
                    ? 'bg-white border-white' 
                    : 'bg-transparent border-white/60 hover:border-white hover:bg-white/20'
                } transition-all duration-300`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
          
          <div className="h-5 border-l border-dotted border-white/40 mx-2"></div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10 rounded-full border border-dotted border-white/30"
            onClick={() => setIsVisible(false)}
          >
            <X size={10} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar; 