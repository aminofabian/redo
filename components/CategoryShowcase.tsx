"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TopSeller {
  id: string;
  title: string;
  image: string;
  price: number;
  viewCount: number;
}

interface CategoryStat {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  productCount: number;
  percentage: number;
  avgPrice: number;
  topSeller: TopSeller | null;
}

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories/stats');
        if (!res.ok) throw new Error('Failed to fetch');
        let data = await res.json();
        
        // For development only - add sample data if stats are empty
        if (process.env.NODE_ENV === 'development') {
          data = data.map((cat: CategoryStat) => ({
            ...cat,
            productCount: cat.productCount || 12,
            percentage: cat.percentage || Math.floor(Math.random() * 25) + 5,
            avgPrice: cat.avgPrice || Math.floor(Math.random() * 50) + 10,
            topSeller: cat.topSeller || {
              id: 'sample-id',
              title: `Sample ${cat.name} Resource`,
              image: '/images/placeholder.jpg',
              price: 24.99,
              viewCount: 150
            }
          }));
        }
        
        setCategories(data);
        if (data.length > 0) {
          setActiveTab(data[0].id);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="w-full py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Resource Categories</h2>
          <p className="text-center text-gray-600">No categories found</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-2">Explore Our Categories</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Discover our comprehensive collection of nursing resources across different specialized categories.
        </p>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {categories.slice(0, 4).map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-lg shadow-md p-6 text-center"
            >
              <h3 className="font-bold text-lg mb-2">{category.name}</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <p className="text-gray-500 text-sm mb-1">{category.productCount} Resources</p>
              <p className="text-gray-700 font-medium">Avg. ${category.avgPrice.toFixed(2)}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Active Category Details */}
        {activeTab && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {categories.filter(c => c.id === activeTab).map((category) => (
              <div key={category.id} className="md:flex">
                <div className="md:w-1/2 p-8">
                  <h3 className="text-2xl font-bold mb-4">{category.name}</h3>
                  <p className="text-gray-600 mb-6">{category.description || 'Explore our carefully curated selection of resources in this category.'}</p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{category.productCount} Resources Available</p>
                        <p className="text-sm text-gray-500">Representing {category.percentage}% of our catalog</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Average Price: ${category.avgPrice.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Affordable quality resources</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/categories/${category.slug || category.id}`} 
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Explore Category
                  </Link>
                </div>
                
                <div className="md:w-1/2 bg-gray-50">
                  {category.topSeller ? (
                    <div className="p-8">
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                      <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                        <Image
                          src={category.topSeller.image}
                          alt={category.topSeller.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{category.topSeller.title}</h4>
                      <p className="text-blue-600 font-bold text-xl mb-2">${category.topSeller.price.toFixed(2)}</p>
                      <p className="text-gray-500 text-sm">{category.topSeller.viewCount}+ students have viewed this resource</p>
                      
                      <Link href={`/products/${category.topSeller.id}`} 
                            className="mt-4 inline-block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        View Details
                      </Link>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                        </div>
                        <h4 className="font-medium text-gray-600">New resources coming soon!</h4>
                        <p className="text-sm text-gray-500 mt-2">Check back for top resources in this category</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Category Distribution Chart */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">Category Distribution</h3>
          <div className="max-w-3xl mx-auto h-8 bg-gray-200 rounded-full overflow-hidden">
            {categories.map((category, index) => {
              // Calculate the width based on percentage
              const width = `${category.percentage}%`;
              
              // Assign a color based on index
              const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500',
                'bg-red-500', 'bg-teal-500', 'bg-orange-500'
              ];
              const color = colors[index % colors.length];
              
              return (
                <div 
                  key={category.id}
                  className={`h-full ${color} inline-block`}
                  style={{ width }}
                  title={`${category.name}: ${category.percentage}%`}
                ></div>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center mt-4 max-w-3xl mx-auto">
            {categories.map((category, index) => {
              const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500',
                'bg-red-500', 'bg-teal-500', 'bg-orange-500'
              ];
              const color = colors[index % colors.length];
              
              return (
                <div key={category.id} className="flex items-center mr-4 mb-2">
                  <div className={`w-3 h-3 ${color} rounded-full mr-1`}></div>
                  <span className="text-xs text-gray-600">{category.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
} 