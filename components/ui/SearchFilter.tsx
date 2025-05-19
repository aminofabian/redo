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
      
      // Fetch categories from the database
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      // Filter categories with path starting with "university/" and extract university names
      const universitySet = new Set<string>();

      // Recursive function to process categories and their children
      const processCategories = (categories: any[]) => {
        categories.forEach((category: any) => {
          // Check if path starts with "university/"
          if (category?.path && category.path.startsWith('university/')) {
            // Split the path to get all segments
            const pathSegments = category.path.split('/');
            
            // The university slug is either the second segment or, for paths like
            // 'university/university-of-columbia/nice', we need to examine the structure
            let universitySlug = '';
            
            // Basic case: university/{university-name}
            if (pathSegments.length >= 2) {
              universitySlug = pathSegments[1];
              
              // Special case: Handle paths with "university" in the second segment
              // like 'university/university-of-columbia/nice'
              if (universitySlug.startsWith('university-') && pathSegments.length >= 3) {
                // For university of X patterns, combine the segments
                if (universitySlug === 'university-of' && pathSegments.length >= 3) {
                  universitySlug = `${universitySlug}-${pathSegments[2]}`;
                }
                // For university-X patterns, keep as is
              }
              
              // Special case: Handle 'university/university-hawaii' or similar 
              // patterns where the university name includes "university"
              if (universitySlug.startsWith('university-')) {
                // Keep as is, will be formatted properly below
              }
              
              if (universitySlug) {
                // Format the university name from the slug
                let universityName = universitySlug
                  .replace(/-/g, ' ') // Replace hyphens with spaces
                  .replace(/\buniversity\s+of\b/i, 'University of') // Fix "university of" capitalization
                  .replace(/\b(\w)/g, (l: string) => l.toUpperCase()); // Capitalize all words
                
                // Special formatting for universities that start with "University"
                universityName = universityName.startsWith('University ') 
                  ? universityName
                  : (universityName.toLowerCase().includes('university') 
                      ? universityName 
                      : `${universityName} University`);
                      
                // Debug logging to help troubleshoot extraction issues
                console.log(`Extracted university from path: ${category.path} -> ${universityName}`);
                      
                universitySet.add(universityName);
              }
            }
          }
          
          // Process children recursively if they exist
          if (category.children && category.children.length > 0) {
            processCategories(category.children);
          }
        });
      };
      
      // Start processing from top-level categories
      processCategories(data);
      
      // Convert Set to sorted array
      const formattedUniversities = Array.from(universitySet).sort();
      setUniversities(formattedUniversities);
    } catch (error) {
      console.error('Error fetching universities from categories:', error);
      // Fallback to empty array if there's an error
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  // Load universities from props if available, otherwise trigger fetch when filter is opened
  useEffect(() => {
    if (propUniversities) {
      setUniversities(propUniversities);
      setLoading(false);
    }
  }, [propUniversities]);
  
  // Fetch universities when the filter is opened and we don't have any yet
  useEffect(() => {
    if (showFilters && !propUniversities && universities.length === 0) {
      fetchUniversities();
    }
  }, [showFilters, propUniversities, universities.length]);

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
              if (!showFilters && !propUniversities && universities.length === 0) {
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
                ) : (
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