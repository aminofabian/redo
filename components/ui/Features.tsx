"use client";

import { BookOpen, GraduationCap, Clock, Download } from "lucide-react";

const Features = () => {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-center text-3xl font-bold text-[#1e2c51] mb-2">
          All inclusive study materials, Start Learning Today!
        </h2>
        <div className="w-40 h-1 bg-[#ffd60a] mx-auto mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-[#5d8e9a]/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#5d8e9a]" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#1e2c51] mb-2">
                Complete Study Materials
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Comprehensive study guides and practice questions carefully curated by nursing experts
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-[#5d8e9a]/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#5d8e9a]" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#1e2c51] mb-2">
                Expert-Verified Content
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                All materials are verified by experienced nursing educators and practitioners
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-[#5d8e9a]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#5d8e9a]" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#1e2c51] mb-2">
                Instant Access
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get immediate access to all resources after purchase, available 24/7
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-[#5d8e9a]/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-[#5d8e9a]" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#1e2c51] mb-2">
                Downloadable Resources
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Download and access materials offline for convenient studying anytime, anywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features; 