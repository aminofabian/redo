"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, User, ArrowRight } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Essential NCLEX Study Strategies for Success",
    excerpt: "Master proven study techniques and strategies to help you ace the NCLEX examination...",
    image: "/nursingresources/ai-generated-8846706_1920.png",
    author: "Sarah Johnson, RN",
    readTime: "5 min read",
    category: "Exam Prep",
    date: "Mar 15, 2024"
  },
  {
    id: 2,
    title: "Understanding Pathophysiology: A Student's Guide",
    excerpt: "Break down complex pathophysiology concepts with our comprehensive guide...",
    image: "/nursingresources/julia-taubitz-4o3FFu9jenw-unsplash.jpg",
    author: "Dr. Michael Chen",
    readTime: "8 min read",
    category: "Study Guides",
    date: "Mar 12, 2024"
  },
  {
    id: 3,
    title: "Top Nursing Schools in 2024: Complete Guide",
    excerpt: "Discover the best nursing programs and what makes them stand out...",
    image: "/nursingresources/jasmine-coro-3NgnoYlNKdk-unsplash.jpg",
    author: "Emily Parker, MSN",
    readTime: "6 min read",
    category: "Education",
    date: "Mar 10, 2024"
  }
];

const BlogSection = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Latest from Our Blog
          </h2>
          <div className="w-20 h-1 bg-[#5d8e9a] mx-auto mt-2" />
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest nursing education insights, study tips, and success stories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <Link href={`/blog/${post.id}`}>
                <div className="relative h-48">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-xs font-medium bg-[#5d8e9a] text-white rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-[#5d8e9a] text-sm font-medium hover:text-[#537f8a] transition-colors">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-sm font-medium"
          >
            View All Articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogSection; 