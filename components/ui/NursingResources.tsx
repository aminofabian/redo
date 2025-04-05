"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Users, BookOpen, Star } from "lucide-react";
import { Button } from "./button";
import Image from "next/image";

const NursingResources = [
  {
    id: 1,
    title: "Adult Health 2 (NR 325) Exam 1",
    location: "Chamberlain University",
    originalPrice: "$235.00",
    price: "$99.99",
    details: "8 Days | 5 Dept.",
    image: "/nursingresources/ai-generated-8451341_1280.png",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 2,
    title: "SCI 225 Pathophysiology Final",
    location: "Nightingale University",
    originalPrice: "$230.00",
    price: "$99.99",
    details: "10 Days | 5 Dept.",
    image: "/nursingresources/anatomy-254129_1280.jpg",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 3,
    title: "D446 Adult Health II OA 1",
    location: "WGU",
    originalPrice: "$245.00",
    price: "$99.99",
    details: "7 Days | 10 Dept.",
    image: "/nursingresources/ai-generated-8846706_1920.png",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 4,
    title: "Advanced Health Assessment",
    location: "Walden University",
    originalPrice: "$305.00",
    price: "$99.99",
    details: "11 Days | 2 Dept.",
    image: "/nursingresources/jasmine-coro-3NgnoYlNKdk-unsplash.jpg",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 5,
    title: "Mental Health NURS 6660",
    location: "Capella University",
    originalPrice: "$325.00",
    price: "$99.99",
    details: "11 Days | 8 Dept.",
    image: "/nursingresources/julia-taubitz-4o3FFu9jenw-unsplash.jpg",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 6,
    title: "NSG 328 Pharmacology",
    location: "Aspen University",
    originalPrice: "$325.00",
    price: "$99.99",
    details: "10 Days | 2 Dept.",
    image: "/nursingresources/ai-generated-8846722_1920.png",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 7,
    title: "Pediatric Nursing NURS 4455",
    location: "Grand Canyon University",
    originalPrice: "$475.00",
    price: "$99.99",
    details: "10 Days | 1 Dept.",
    image: "/nursingresources/girl-2771936_1920.jpg",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 8,
    title: "OB/GYN Nursing Final",
    location: "Walden University",
    originalPrice: "$325.00",
    price: "$99.99",
    details: "8 Days | 3 Dept.",
    image: "/nursingresources/treatment-of-skin-2416946_1920.jpg",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  },
  {
    id: 9,
    title: "Critical Care Study Guide",
    location: "Chamberlain University",
    originalPrice: "$295.00",
    price: "$99.99",
    details: "9 Days | 4 Dept.",
    image: "/nursingresources/seniors-1505943_1920.jpg",
    questions: "150 Questions",
    students: "2.5K+ Students",
    rating: 4.8,
    reviews: 380,
    lastUpdated: "Updated 2 days ago"
  }
];

const NursingResourcesSection = () => {
  return (
    <div className="bg-[#fdfbf7] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1e2c51]">
            Best Packages to Complete Your
          </h2>
          <h3 className="text-2xl md:text-3xl text-[#1e2c51] mt-2">
            Nursing Program
          </h3>
          <p className="mt-4 text-gray-600">
            Choose from the best study materials to make your education complete with unforgettable experiences and savings!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {NursingResources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: resource.id * 0.1 }}
              className="bg-white rounded-3xl shadow-md overflow-hidden group"
            >
              <div className="relative h-48">
                <Image
                  src={resource.image}
                  alt={resource.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Save {Math.round(((parseFloat(resource.originalPrice.slice(1)) - parseFloat(resource.price.slice(1))) / parseFloat(resource.originalPrice.slice(1))) * 100)}%
                </div>
                <div className="absolute bottom-4 left-4 bg-[#5d8e9a] text-white px-4 py-1 rounded-full text-sm">
                  {resource.price}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-[#1e2c51] flex-1">
                    {resource.title}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{resource.rating}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{resource.location}</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-500 text-sm mt-2">
                  <Clock className="w-4 h-4" />
                  <span>{resource.details}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="w-4 h-4" />
                      <span>{resource.questions}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{resource.students}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500 line-through">
                        {resource.originalPrice}
                      </span>
                      <span className="ml-2 text-lg font-bold text-[#1e2c51]">
                        {resource.price}
                      </span>
                    </div>
                    <button className="bg-[#5d8e9a] hover:bg-[#537f8a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      View Details
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    {resource.lastUpdated}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-[#ffd60a] hover:bg-yellow-400 text-[#1e2c51] font-semibold px-8 py-3 rounded-lg transition-colors">
            View More
          </button>
        </div>
      </div>
    </div>
  );
};

export default NursingResourcesSection; 