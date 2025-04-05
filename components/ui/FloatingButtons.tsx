"use client";

import { MessageCircle, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingButtons() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/1234567890', '_blank');
  };

  const handleChat = () => {
    // Add your chat functionality here
    console.log('Open chat');
  };

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col gap-4">
      {/* Chat Button */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 bg-[#5d8e9a] rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.button
          onClick={handleChat}
          className="relative flex items-center gap-2 bg-[#5d8e9a] text-white rounded-full shadow-lg hover:bg-[#537f8a] transition-colors"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="sm:hidden p-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-3">
            <MessageSquare className="w-6 h-6" />
            <span className="font-medium whitespace-nowrap">Live Chat</span>
          </div>
        </motion.button>
      </div>

      {/* WhatsApp Button */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.button
          onClick={handleWhatsApp}
          className="relative flex items-center gap-2 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="sm:hidden p-3">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-3">
            <MessageCircle className="w-6 h-6" />
            <span className="font-medium whitespace-nowrap">WhatsApp</span>
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.button>
      </div>
    </div>
  );
} 