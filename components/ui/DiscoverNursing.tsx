"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const filters = [
  { id: "popular", label: "Popular Study Materials" },
  { id: "fundamentals", label: "Nursing Fundamentals" },
  { id: "med-surg", label: "Medical-Surgical" },
  { id: "pediatrics", label: "Pediatric Nursing" },
  { id: "mental", label: "Mental Health" }
];

const courses = [
  {
    id: 1,
    title: "Adult Health 2 Complete Package",
    image: "/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg",
    reviews: 37,
    rating: 5,
    isAllInclusive: true,
    days: 15,
    destinations: "12 Modules",
    cities: "24 Tests",
    departures: "8 Exams",
    category: "med-surg",
    emi: {
      amount: "$14.99",
      period: "/mo"
    },
    startingPrice: {
      amount: "$99.99",
      note: "one-time payment"
    }
  },
  {
    id: 2,
    title: "Fundamentals of Nursing Bundle",
    image: "/categories/fahrul-azmi-cFUZ-6i83vs-unsplash.jpg",
    reviews: 42,
    rating: 5,
    isAllInclusive: true,
    days: 10,
    destinations: "10 Modules",
    cities: "16 Tests",
    departures: "4 Exams",
    category: "fundamentals",
    emi: {
      amount: "$12.99",
      period: "/mo"
    },
    startingPrice: {
      amount: "$89.99",
      note: "one-time payment"
    }
  },
  {
    id: 3,
    title: "Pediatric Nursing Comprehensive",
    image: "/categories/marissa-grootes-flRm0z3MEoA-unsplash.jpg",
    reviews: 28,
    rating: 4.9,
    isAllInclusive: true,
    days: 12,
    destinations: "8 Modules",
    cities: "20 Tests",
    departures: "6 Exams",
    category: "pediatrics",
    emi: {
      amount: "$13.99",
      period: "/mo"
    },
    startingPrice: {
      amount: "$94.99",
      note: "one-time payment"
    }
  },
  {
    id: 4,
    title: "Mental Health Nursing Complete",
    image: "/categories/sincerely-media--IIIr1Hu6aY-unsplash.jpg",
    reviews: 31,
    rating: 4.8,
    isAllInclusive: true,
    days: 14,
    destinations: "9 Modules",
    cities: "18 Tests",
    departures: "5 Exams",
    category: "mental",
    emi: {
      amount: "$13.99",
      period: "/mo"
    },
    startingPrice: {
      amount: "$94.99",
      note: "one-time payment"
    }
  },
  {
    id: 5,
    title: "Health Assessment Package",
    image: "/categories/julia-taubitz-6JUYocDPaZo-unsplash.jpg",
    reviews: 45,
    rating: 4.9,
    isAllInclusive: true,
    days: 8,
    destinations: "6 Modules",
    cities: "15 Tests",
    departures: "4 Exams",
    category: "fundamentals",
    emi: {
      amount: "$11.99",
      period: "/mo"
    },
    startingPrice: {
      amount: "$79.99",
      note: "one-time payment"
    }
  },
  {
    id: 6,
    title: "Critical Care Nursing Bundle",
    image: "/categories/olga-guryanova-tMFeatBSS4s-unsplash.jpg",
    reviews: 33,
    rating: 4.8,
    isAllInclusive: true,
    days: 16,
    destinations: "11 Modules",
    cities: "22 Tests",
    departures: "7 Exams",
    category: "med-surg",
    emi: {
      amount: "$14.99",
      period: "/mo"
    },
    startingPrice: {
      amount: "$99.99",
      note: "one-time payment"
    }
  }
];

const DiscoverNursing = () => {
  const [activeFilter, setActiveFilter] = useState("popular");

  const filteredCourses = activeFilter === "popular" 
    ? courses 
    : courses.filter(course => course.category === activeFilter);

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#1e2c51]">
            Discover Nursing Resources
          </h2>
          <div className="w-32 h-1 bg-[#5d8e9a] mx-auto mt-2 mb-8" />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${filter.id === activeFilter
                  ? "bg-[#1e2c51] text-white" 
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          layout
        >
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden group"
            >
              <Link href={`/course/${course.id}`}>
                <div className="relative">
                  <div className="relative h-[200px]">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-[#5d8e9a] text-white px-3 py-1 text-sm rounded-full">
                      FEATURED
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg text-[#1e2c51]">
                        {course.title}
                      </h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < course.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {course.reviews} Reviews
                        </span>
                      </div>
                    </div>

                    {course.isAllInclusive && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[#5d8e9a]">✓</span>
                        <span className="text-sm text-gray-600">All Inclusive</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <div className="font-semibold text-[#1e2c51]">{course.days}</div>
                        <div className="text-gray-500">Days</div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1e2c51]">{course.destinations}</div>
                        <div className="text-gray-500">Destinations</div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1e2c51]">{course.departures}</div>
                        <div className="text-gray-500">Departures</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-500">EMI from</div>
                        <div className="text-lg font-bold text-[#1e2c51]">
                          {course.emi.amount}
                          <span className="text-sm font-normal text-gray-500">
                            {course.emi.period}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Starts from</div>
                        <div>
                          <div className="text-lg font-bold text-[#1e2c51]">
                            {course.startingPrice.amount}
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {course.startingPrice.note}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <button className="bg-[#ffd60a] hover:bg-yellow-400 text-[#1e2c51] font-semibold px-8 py-3 rounded-lg transition-colors">
            View More
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverNursing; 