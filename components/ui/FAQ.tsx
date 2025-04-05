"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How do I access the study materials?",
    answer: "Once you purchase a course, you'll have immediate access to all materials through your student dashboard. You can access the content 24/7 from any device with an internet connection."
  },
  {
    question: "Are the practice questions similar to actual NCLEX questions?",
    answer: "Yes, our practice questions are crafted by experienced nursing educators to mirror the style and difficulty of actual NCLEX questions. We regularly update our question bank based on the latest exam patterns."
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "We offer a 30-day money-back guarantee if you're not completely satisfied with your purchase. Simply contact our support team to process your refund."
  },
  {
    question: "How long do I have access to the course materials?",
    answer: "You get lifetime access to all purchased course materials, including any future updates we make to the content."
  },
  {
    question: "Do you offer payment plans?",
    answer: "Yes, we offer flexible EMI options for all our courses. You can split your payment into manageable monthly installments at checkout."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="w-20 h-1 bg-[#5d8e9a] mx-auto mt-2" />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ; 