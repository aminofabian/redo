"use client";

import { useState, useEffect } from "react";
import { Search, Filter, GraduationCap, X } from "lucide-react";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchFilterProps {
  universities?: string[]; // Accept formatted university names
}

const SearchFilter: React.FC<SearchFilterProps> = ({ universities: propUniversities }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [universities, setUniversities] = useState<string[]>(propUniversities || []);
  const [loading, setLoading] = useState(!propUniversities);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(
    searchParams.get("university")
  );

  // Function to fetch universities from the database
  const fetchUniversities = async () => {
    try {
      setLoading(true);
      console.log("Fetching universities...");
      
      // Fetch categories from the database
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      // Debug - Log all received categories to understand what data we have
      console.log('All categories received:', data);
      
      // Extract all paths from categories for debugging
      const allPaths: {name: string, path: string, pathA?: string}[] = [];
      
      // Helper function to extract all paths recursively
      const extractAllPaths = (categories: any[]) => {
        categories.forEach(cat => {
          // Check for both path and pathA fields
          if (cat?.path || cat?.pathA) {
            allPaths.push({ 
              name: cat.name || '', 
              path: cat.path || '', 
              pathA: cat.pathA || ''
            });
            
            if (cat?.pathA) {
              console.log(`Found category with pathA: ${cat.name || 'Unknown'}, PathA: ${cat.pathA}`);
            }
            if (cat?.path) {
              console.log(`Found category with path: ${cat.name || 'Unknown'}, Path: ${cat.path}`);
            }
          }
          
          if (cat?.children && Array.isArray(cat.children) && cat.children.length > 0) {
            extractAllPaths(cat.children);
          }
        });
      };
      
      extractAllPaths(data);
      console.log(`Found ${allPaths.length} categories with paths`);
      
      // Set to store unique university names
      const universitySet = new Set<string>();

      // 1. Extract from paths and pathA values containing "university"
      allPaths.forEach(({ name, path, pathA }) => {
        // Check both path and pathA fields for university information
        const sourcePath = pathA && pathA.includes('university') ? pathA : path;
        const sourceType = pathA && pathA.includes('university') ? 'pathA' : 'path';
        
        if (sourcePath && sourcePath.toLowerCase().includes('university')) {
          console.log(`Processing university ${sourceType}: ${sourcePath}`);
          
          // Extract university name using multiple strategies
          let universityName = '';
          const segments = sourcePath.split('/');
          
          // Strategy 1: Direct extraction from path segments
          if (segments[0] === 'university' && segments.length >= 2) {
            universityName = segments[1];
            console.log(`Strategy 1 extracted from ${sourceType}: ${universityName}`);
          }
          
          // Strategy 2a: Handle "university-of-" pattern (these are high priority)
          if (sourcePath.includes('university/university-of-')) {
            const match = sourcePath.match(/university\/(university-of-[\w-]+)/);
            if (match && match[1]) {
              universityName = match[1];
              console.log(`Strategy 2a extracted from ${sourceType}: ${universityName}`);
            }
          }
          
          // Strategy 2b: Handle "university-" pattern (like university-hawaii)
          if (!universityName && sourcePath.includes('university/university-')) {
            const match = sourcePath.match(/university\/(university-[\w-]+)/);
            if (match && match[1]) {
              universityName = match[1];
              console.log(`Strategy 2b extracted from ${sourceType}: ${universityName}`);
            }
          }
          
          // Strategy 3: Generic extraction using path components
          if (!universityName) {
            // Extract potential university names from any part of the path
            const universityKeywords = sourcePath.toLowerCase().match(/[a-z]+-?[a-z]+/g) || [];
            
            for (const keyword of universityKeywords) {
              if (keyword.length > 3 && !['university', 'product', 'type', 'path'].includes(keyword)) {
                universityName = keyword;
                console.log(`Strategy 3 extracted university keyword from ${sourceType}: ${keyword}`);
                break;
              }
            }
          }
          
          // Strategy 4: Use category name if it contains "University"
          if (!universityName && name && name.includes('University')) {
            universityName = name;
            console.log(`Strategy 4 extracted from name: ${universityName}`);
          }
          
          // Format extracted university name
          if (universityName) {
            // Format slugs into proper names
            if (universityName.includes('-')) {
              universityName = universityName
                .replace(/-/g, ' ')
                .replace(/\buniversity\s+of\b/i, 'University of')
                .replace(/\b(\w)/g, (char: string) => char.toUpperCase());
            }
            
            // Add "University" suffix if needed
            if (!universityName.toLowerCase().includes('university')) {
              universityName = `${universityName} University`;
            }
            
            console.log(`✅ Extracted: ${universityName} from ${sourceType} ${sourcePath}`);
            universitySet.add(universityName);
          }
        }
      });
      
      // 2. Extract from category names directly
      allPaths.forEach(({ name }) => {
        if (name && name.includes('University')) {
          console.log(`Found university in name: ${name}`);
          universitySet.add(name);
        }
      });
      
      // Log all extracted universities for debugging
      console.log('Raw universities found from database:', Array.from(universitySet));
      
      // Filter out generic "University" entries and normalize names
      const filteredUniversities = Array.from(universitySet).filter(uni => {
        // Remove entries that are just "University" or too generic
        if (!uni || uni.trim() === "University" || uni.trim() === "") {
          console.log(`Filtering out generic entry: "${uni}"`);
          return false;
        }
        
        // Keep all other university names
        return true;
      });
      
      // Further normalize university names to remove duplicates with slight variations
      // Create a map to group similar university names
      const normalizedMap = new Map<string, string>();
      
      filteredUniversities.forEach(uni => {
        // Create a normalized key by removing spaces, converting to lowercase
        const normalizedKey = uni.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/university/g, 'uni')
          .replace(/of/g, '');
        
        // If we haven't seen this university before, add it
        // If we have, keep the longer/more detailed name
        if (!normalizedMap.has(normalizedKey) || uni.length > normalizedMap.get(normalizedKey)!.length) {
          normalizedMap.set(normalizedKey, uni);
        }
      });
      
      // Convert to sorted array
      const formattedUniversities = Array.from(normalizedMap.values()).sort();
      console.log(`Final filtered list (${formattedUniversities.length} universities):`, formattedUniversities);
      
      setUniversities(formattedUniversities);
    } catch (error) {
      console.error('Error fetching universities:', error);
      // Don't use any fallback - just set empty array to show the error state
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  // Load universities from props if available
  useEffect(() => {
    if (propUniversities?.length) {
      setUniversities(propUniversities);
      setLoading(false);
    }
  }, [propUniversities]);
  
  // Fetch universities when filter is opened
  useEffect(() => {
    if (showFilters && universities.length === 0) {
      fetchUniversities();
    }
  }, [showFilters, universities.length]);

  const handleUniversitySelect = (name: string) => {
    setSelectedUniversity(prev => prev === name ? null : name);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the query parameters for search
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedUniversity) params.set("university", selectedUniversity);
    
    // Navigate using the router with search parameters
    router.push(`/?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedUniversity(null);
    router.push("/");
  };

  return (
    <motion.div
      className="w-full bg-white/95 rounded-xl shadow-lg border border-gray-200 backdrop-blur-sm p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ boxShadow: "0 10px 25px -5px rgba(93, 142, 154, 0.1), 0 8px 10px -6px rgba(93, 142, 154, 0.1)" }}
    >
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-6 h-6 text-[#5d8e9a]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border-2 border-gray-200 text-gray-900 text-base rounded-lg focus:ring-[#5d8e9a] focus:border-[#5d8e9a] block w-full pl-12 p-4 h-14 shadow-sm"
              placeholder="Search for study materials, practice tests..."
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <Button 
            type="button"
            variant="outline"
            className={`border-2 border-[#5d8e9a] text-[#5d8e9a] px-6 h-14 text-base font-medium transition-all duration-300 ${showFilters ? 'bg-[#5d8e9a]/10' : 'hover:bg-[#5d8e9a]/5'}`}
            onClick={() => {
              // Toggle filter visibility
              setShowFilters(!showFilters);
              
              // If opening the filter and we don't have universities yet, fetch them
              if (!showFilters && universities.length === 0) {
                fetchUniversities();
              }
            }}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filter by University
          </Button>

          {/* Search button */}
          <Button 
            type="submit"
            className="bg-gradient-to-r from-[#5d8e9a] to-[#3a6b79] hover:from-[#4d7e8a] hover:to-[#2a5b69] text-white px-6 h-14 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </div>

        {/* University filter options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-200">
                <h3 className="flex items-center text-base font-medium text-gray-700 mb-4">
                  <GraduationCap className="w-5 h-5 mr-2 text-[#5d8e9a]" />
                  Select University
                </h3>
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Loading universities...</div>
                ) : universities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {universities.map((university, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleUniversitySelect(university)}
                        className={`text-left text-sm px-4 py-3 rounded-md transition-all duration-200 ${
                          selectedUniversity === university
                            ? 'bg-[#5d8e9a]/20 text-[#5d8e9a] font-medium shadow-sm'
                            : 'hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                        }`}
                      >
                        {university}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No universities found. Please try again later.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
};

export default SearchFilter; 