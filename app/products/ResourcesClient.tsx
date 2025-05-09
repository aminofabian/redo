"use client";

import React, { useState, useEffect } from "react";
import { Star, BookOpen, Clock, Users, Grid, List, ChevronDown, SlidersHorizontal, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateProductSlug } from "../../lib/products";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Type definition to match your data structure
type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  hasDiscount: boolean;
  monthlyPrice: number;
  rating: string;
  reviews: number;
  type: string;
  duration: string;
  tags: string[];
  questions?: string;
  chapters?: string;
  downloadLimit?: number;
  featured: boolean;
  viewCount: number;
  categories?: { category: { name: string; path?: string } }[];
  CategoryPath?: { path: string; level1?: string; level2?: string; level3?: string }[];
  // Add potential metadata fields
  university?: string;
  level?: string;
  subject?: string;
  format?: string;
};

// Define filter group type
type FilterGroup = {
  id: string;
  name: string;
  options: string[];
};

// Define valid filter keys
type FilterKey = 'type' | 'university' | 'level';

export default function ResourcesClient({ initialResources }: { initialResources: Resource[] }) {
  const [products, setProducts] = useState<Resource[]>(initialResources);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    type: "",
    university: "",
    level: "",
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Extract categories by their hierarchy level or type
  const getCategoriesByType = (type: string): string[] => {
    const values = new Set<string>();
    
    initialResources.forEach(resource => {
      if (resource.categories && resource.categories.length > 0) {
        resource.categories.forEach(categoryRelation => {
          const category = categoryRelation.category;
          
          // Check if the category path starts with our type (e.g., "university/")
          // or if the category name directly matches our type
          if (category.path?.startsWith(`${type}/`) || 
              category.name.toLowerCase() === type.toLowerCase()) {
            values.add(category.name);
          }
        });
      }
    });
    
    return Array.from(values).sort();
  };

  // Get universities from category data
  const getUniversities = (): string[] => {
    const values = new Set<string>();
    
    initialResources.forEach(resource => {
      // Try to extract from CategoryPath first (most reliable)
      if (resource.CategoryPath && resource.CategoryPath.length > 0) {
        resource.CategoryPath.forEach(catPath => {
          // Look for university in level1 and level2
          if (catPath.level1 === 'university' && catPath.level2) {
            // Standardize the formatting
            const formatted = catPath.level2
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
            values.add(formatted);
            console.log(`Found university from CategoryPath: ${formatted}`);
          }
        });
      }
      
      // Then check regular categories
      if (resource.categories && resource.categories.length > 0) {
        resource.categories.forEach(categoryRelation => {
          if (categoryRelation && categoryRelation.category) {
            const category = categoryRelation.category;
            
            // Check if category name contains university keywords
            if (category.name.includes('University') || 
                category.name.includes('College') || 
                [
                  'Harvard', 'Stanford', 'MIT', 'Yale', 'Princeton', 
                  'Oxford', 'Cambridge', 'UCLA', 'Berkeley'
                ].some(uni => category.name.includes(uni))) {
              values.add(category.name);
              console.log(`Found university from category: ${category.name}`);
            }
          }
        });
      }
    });
    
    return Array.from(values).sort();
  };

  // Get academic levels from category data
  const getLevels = (): string[] => {
    const values = new Set<string>();
    const levelKeywords = [
      'Undergraduate', 'Graduate', 'PhD', 'Bachelor', 'Master',
      'Beginner', 'Intermediate', 'Advanced', 'Year'
    ];
    
    initialResources.forEach(resource => {
      // Try CategoryPath first
      if (resource.CategoryPath && resource.CategoryPath.length > 0) {
        resource.CategoryPath.forEach(catPath => {
          // Check if level3 contains level keywords
          if (catPath.level3 && levelKeywords.some(keyword => 
              catPath.level3!.toLowerCase().includes(keyword.toLowerCase())
          )) {
            values.add(catPath.level3.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
          }
        });
      }
      
      // Then check categories
      if (resource.categories && resource.categories.length > 0) {
        resource.categories.forEach(categoryRelation => {
          const category = categoryRelation.category;
          
          // Check if category name contains level keywords
          if (levelKeywords.some(keyword => 
              category.name.toLowerCase().includes(keyword.toLowerCase())
          )) {
            values.add(category.name);
          }
        });
      }
      
      // Check tags
      resource.tags.forEach(tag => {
        if (levelKeywords.some(keyword => 
            tag.toLowerCase().includes(keyword.toLowerCase())
        )) {
          values.add(tag);
        }
      });
    });
    
    return Array.from(values).sort();
  };

  // Now update the filter groups to use these functions
  const filterGroups: FilterGroup[] = [
    {
      id: 'type',
      name: 'Product Type',
      options: Array.from(new Set(initialResources.map(r => r.type))).filter(Boolean),
    },
    {
      id: 'university',
      name: 'University',
      options: getUniversities(),
    },
    {
      id: 'level',
      name: 'Academic Level',
      options: getLevels(),
    }
  ];

  // Get unique categories for category filter
  const categories = ["All", ...Array.from(new Set(
    initialResources.flatMap(resource => resource.tags)
  ))];

  // Count active filters
  useEffect(() => {
    const count = Object.values(selectedFilters).filter(value => value !== "").length;
    setActiveFiltersCount(count);
  }, [selectedFilters]);

  // Filter function
  const applyFilters = () => {
    let filtered = [...initialResources];
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(search) ||
        resource.description.toLowerCase().includes(search) ||
        resource.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Filter by category
    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(resource => 
        resource.tags.includes(selectedCategory)
      );
    }
    
    // Filter by product type
    if (selectedFilters.type) {
      filtered = filtered.filter(resource => resource.type === selectedFilters.type);
    }
    
    // Filter by university
    if (selectedFilters.university) {
      filtered = filtered.filter(resource => {
        // Check in CategoryPath
        if (resource.CategoryPath && resource.CategoryPath.length > 0) {
          if (resource.CategoryPath.some(catPath => 
            catPath.level1 === 'university' &&
            catPath.level2 && 
            catPath.level2.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) === selectedFilters.university
          )) {
            return true;
          }
        }
        
        // Check in regular categories
        if (resource.categories && resource.categories.length > 0) {
          if (resource.categories.some(cat => cat.category.name === selectedFilters.university)) {
            return true;
          }
        }
        
        // Check in tags
        return resource.tags.includes(selectedFilters.university);
      });
    }
    
    // Filter by level
    if (selectedFilters.level) {
      filtered = filtered.filter(resource => {
        const level = selectedFilters.level;
        
        // Check in CategoryPath
        if (resource.CategoryPath && resource.CategoryPath.length > 0) {
          for (const catPath of resource.CategoryPath) {
            if (catPath.level3 && 
                catPath.level3.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) === level) {
              return true;
            }
          }
        }
        
        // Check in categories
        if (resource.categories && resource.categories.length > 0) {
          for (const cat of resource.categories) {
            if (cat.category.name === level) {
              return true;
            }
          }
        }
        
        // Finally check in tags
        return resource.tags.some(tag => tag === level);
      });
    }
    
    // Apply sorting
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "rating":
        filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      case "newest":
        // Assuming you have a date field, otherwise fall back to popularity
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "priceAsc":
        filtered.sort((a, b) => a.finalPrice - b.finalPrice);
        break;
      case "priceDesc":
        filtered.sort((a, b) => b.finalPrice - a.finalPrice);
        break;
      default:
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    
    return filtered;
  };

  // Apply filters when they change
  useEffect(() => {
    const filtered = applyFilters();
    setProducts(filtered);
  }, [selectedFilters, sortBy, searchTerm, initialResources]);

  // Filter resources by category
  const filteredResources = selectedCategory === "All" 
    ? products 
    : products.filter(r => r.tags.includes(selectedCategory));

  // Sort options for the dropdown
  const sortOptions = [
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ];

  // Add this function after the handleFilterChange function
  const debugFilter = (filterId: FilterKey, value: string) => {
    console.log(`Debugging filter: ${filterId} = ${value}`);
    
    // Find how many resources would match this filter
    let matchCount = 0;
    
    initialResources.forEach(resource => {
      let matches = false;
      
      if (filterId === 'university') {
        // Check in CategoryPath
        if (resource.CategoryPath && resource.CategoryPath.length > 0) {
          for (const catPath of resource.CategoryPath) {
            if (catPath.level1 === 'university' && 
                catPath.level2 && 
                catPath.level2.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) === value) {
              matches = true;
              break;
            }
          }
        }
        
        // Check in categories
        if (!matches && resource.categories && resource.categories.length > 0) {
          for (const cat of resource.categories) {
            if (cat.category.name === value) {
              matches = true;
              break;
            }
          }
        }
        
        // Check in tags
        if (!matches && resource.tags.some(tag => tag === value)) {
          matches = true;
        }
      }
      
      if (matches) {
        matchCount++;
        console.log(`- Matching resource: ${resource.title}`);
      }
    });
    
    console.log(`Total matches for ${filterId}=${value}: ${matchCount}/${initialResources.length}`);
  };

  // Update handleFilterChange to call the debug function
  const handleFilterChange = (filterId: FilterKey, value: string) => {
    // Debug the filter before applying it
    debugFilter(filterId, value);
    
    setSelectedFilters(prev => ({
      ...prev,
      [filterId]: prev[filterId] === value ? "" : value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({
      type: "",
      university: "",
      level: "",
    });
    setSelectedCategory("All");
    setSearchTerm("");
    setSortBy("popular");
  };

  // Grid item renderer
  const renderGridItem = (resource: Resource) => (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative pb-[60%] overflow-hidden">
          <img
            src={resource.image}
            alt={resource.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {resource.hasDiscount && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              {resource.discountPercent}% OFF
            </Badge>
          )}
        </div>
        
        <CardContent className="flex-grow pt-4">
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{resource.rating}</span>
            <span className="text-xs text-gray-500">({resource.reviews} reviews)</span>
          </div>
          
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{resource.title}</h3>
          
          <div className="flex flex-wrap gap-1 my-2">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="bg-gray-50">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="bg-gray-50">+{resource.tags.length - 3}</Badge>
            )}
          </div>
          
          <p className="text-gray-500 text-sm line-clamp-2 mb-2">{resource.description}</p>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div>
                {resource.hasDiscount ? (
                  <>
                    <span className="text-lg font-bold">${resource.finalPrice}</span>
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ${resource.price}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold">${resource.price}</span>
                )}
              </div>
              
              <Link href={`/products/${resource.slug}`}>
                <Button>View Details</Button>
              </Link>
            </div>
            
            {resource.monthlyPrice && (
              <p className="text-xs text-gray-500 mt-1">
                Or ${resource.monthlyPrice}/month for 3 months
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );

  // List item renderer
  const renderListItem = (resource: Resource) => (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-1/4 h-48 md:h-auto">
            <img
              src={resource.image}
              alt={resource.title}
              className="h-full w-full object-cover"
            />
            {resource.hasDiscount && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                {resource.discountPercent}% OFF
              </Badge>
            )}
          </div>
          
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-xl mb-1">{resource.title}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{resource.rating}</span>
                <span className="text-xs text-gray-500">({resource.reviews})</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 my-2">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-gray-50">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <p className="text-gray-600 my-2 line-clamp-2 flex-grow">{resource.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
              {resource.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{resource.duration}</span>
                </div>
              )}
              {resource.chapters && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{resource.chapters}</span>
                </div>
              )}
              {resource.questions && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{resource.questions}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                {resource.hasDiscount ? (
                  <>
                    <span className="text-lg font-bold">${resource.finalPrice}</span>
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ${resource.price}
                    </span>
                    {resource.monthlyPrice && (
                      <p className="text-xs text-gray-500 mt-1">
                        Or ${resource.monthlyPrice}/month for 3 months
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-lg font-bold">${resource.price}</span>
                )}
              </div>
              
              <Link href={`/products/${resource.slug}`}>
                <Button>View Details</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Render active filters
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(selectedFilters).filter(([_, value]) => value !== "");
    
    if (activeFilters.length === 0 && selectedCategory === "All" && !searchTerm) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Active filters:</span>
        
        {selectedCategory !== "All" && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
            {selectedCategory}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => setSelectedCategory("All")}
            />
          </Badge>
        )}
        
        {searchTerm && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
            Search: {searchTerm}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => setSearchTerm("")}
            />
          </Badge>
        )}
        
        {activeFilters.map(([key, value]) => {
          const filterGroup = filterGroups.find(group => group.id === key);
          const label = filterGroup ? `${filterGroup.name}: ${value}` : value;
          
          return (
            <Badge key={key} className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
              {label}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => handleFilterChange(key as FilterKey, value)}
              />
            </Badge>
          );
        })}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={clearAllFilters}
        >
          Clear all
        </Button>
      </div>
    );
  };

  // Add this after constructing the filterGroups
  useEffect(() => {
    // Check the first few resources to see their structure
    console.log("Sample resource data:");
    if (initialResources.length > 0) {
      const sample = initialResources[0];
      console.log({
        id: sample.id,
        title: sample.title,
        tags: sample.tags,
        categories: sample.categories,
        CategoryPath: sample.CategoryPath
      });
    }
    
    // Log the extracted filters
    console.log("Filter options found:");
    filterGroups.forEach(group => {
      console.log(`${group.name}: ${group.options.length} options`);
      console.log(group.options);
    });
  }, []);

  return (
    <div className="w-full">
      {/* Main grid layout with side menu on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Side menu with university filters (hidden on mobile) */}
        <div className="hidden lg:block bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3 text-lg">Universities</h3>
          
          <div className="space-y-1">
            {/* All Universities option */}
            <button 
              onClick={() => handleFilterChange('university', "")}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors",
                selectedFilters.university === "" 
                  ? "bg-primary text-white" 
                  : "hover:bg-gray-100"
              )}
            >
              All Universities
            </button>
            
            {/* List each university as a filter option */}
            {getUniversities().map(university => (
              <button
                key={university}
                onClick={() => handleFilterChange('university', university)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors",
                  selectedFilters.university === university 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                )}
              >
                {university}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3">
          {/* Search and Category bar */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline"
                className={cn(
                  "flex items-center gap-2",
                  showFilterPanel && "bg-primary/10"
                )}
                onClick={() => setShowFilterPanel(!showFilterPanel)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* Category filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Active filters display */}
            {renderActiveFilters()}
          </div>
          
          {/* Expanded filter panel - show regardless of options count */}
          {showFilterPanel && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filterGroups.map(group => (
                  <div key={group.id} className="space-y-2">
                    <h3 className="font-medium text-sm">{group.name}</h3>
                    {group.options.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {group.options.map(option => (
                          <button
                            key={option}
                            onClick={() => handleFilterChange(group.id as FilterKey, option)}
                            className={cn(
                              "px-3 py-1 text-xs rounded-full border transition-colors",
                              selectedFilters[group.id as FilterKey] === option
                                ? "bg-primary text-white border-primary"
                                : "bg-white hover:bg-gray-50 border-gray-200"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No {group.name.toLowerCase()} options available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                Showing {filteredResources.length} of {initialResources.length} resources
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sort dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span>Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <div className="flex flex-col">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        className={cn(
                          "px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors",
                          sortBy === option.value && "bg-primary/10 font-medium"
                        )}
                        onClick={() => setSortBy(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* View mode toggle */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Resources display */}
          {filteredResources.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => renderGridItem(resource))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {filteredResources.map(resource => renderListItem(resource))}
              </div>
            )
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm p-8">
              <p className="text-gray-500 mb-2">No resources found with the selected filters.</p>
              <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or search term.</p>
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 