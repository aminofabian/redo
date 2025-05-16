"use client";

import { useState } from "react";
import { Search, Filter, GraduationCap, X } from "lucide-react";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";

// University data type
interface University {
  id: string;
  name: string;
  imagePath: string;
}

interface SearchFilterProps {
  universities: University[];
}

const SearchFilter: React.FC<SearchFilterProps> = ({ universities }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  const handleUniversitySelect = (id: string) => {
    setSelectedUniversity(prev => prev === id ? null : id);
    // In a real app, you would trigger the filter/search here
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would trigger the search with the query and filters
    console.log("Searching for:", searchQuery, "University:", selectedUniversity);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedUniversity(null);
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
          {/* Search input - now larger */}
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

          {/* Filter toggle button - now larger */}
          <Button 
            type="button"
            variant="outline"
            className={`border-2 border-[#5d8e9a] text-[#5d8e9a] px-6 h-14 text-base font-medium transition-all duration-300 ${showFilters ? 'bg-[#5d8e9a]/10' : 'hover:bg-[#5d8e9a]/5'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filter by University
          </Button>

          {/* Search button - now larger */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {universities.map((university) => (
                    <button
                      key={university.id}
                      type="button"
                      onClick={() => handleUniversitySelect(university.id)}
                      className={`text-left text-sm px-4 py-3 rounded-md transition-all duration-200 ${
                        selectedUniversity === university.id
                          ? 'bg-[#5d8e9a]/20 text-[#5d8e9a] font-medium shadow-sm'
                          : 'hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                      }`}
                    >
                      {university.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
};

export default SearchFilter; 