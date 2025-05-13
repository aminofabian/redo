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
import ProductCardGallery from "./ProductCardGallery";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Type definition to match your data structure
type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string; // For backward compatibility
  images?: Array<{ id: string; url: string; alt?: string | null; isPrimary?: boolean }>; // New field for multiple images
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

// Define valid filter keys - removed 'level' as requested
type FilterKey = 'type' | 'university';

interface ResourcesClientProps {
  initialResources: Resource[];
  allUniversities: string[];
  allProductTypes: string[];
}

export default function ResourcesClient({ initialResources, allUniversities, allProductTypes }: ResourcesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchTimeout = React.useRef<NodeJS.Timeout>();
  
  // Get filter values from URL query parameters
  const queryType = searchParams.get('type') || "";
  const queryUniversity = searchParams.get('university') || "";
  const queryLevel = searchParams.get('level') || "";
  const queryCategory = searchParams.get('category') || "All";
  const querySearch = searchParams.get('search') || "";
  const querySort = searchParams.get('sort') || "popular";
  const queryView = (searchParams.get('view') as 'grid' | 'list') || 'grid';
  
  // Local UI state
  const [products, setProducts] = useState<Resource[]>(initialResources);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Create an object to track all active filters from URL params (no level filter now)
  const selectedFilters = {
    type: queryType,
    university: queryUniversity,
  };
  
  // Calculate active filters count for the badge
  const activeFiltersCount = Object.values(selectedFilters).filter(Boolean).length +
    (queryCategory !== "All" ? 1 : 0) +
    (querySearch ? 1 : 0);

  // Extract categories by their hierarchy level or type - improved with new data format
  const getCategoriesByType = (type: string): string[] => {
    // If we already have our formatted lists from the database, use those instead
    if (type === 'university' && allUniversities.length > 0) {
      return allUniversities;
    }
    
    if (type === 'product-type' && allProductTypes.length > 0) {
      return allProductTypes;
    }
    
    // Fallback to extracting from current resources if database lists are empty
    const values = new Set<string>();
    
    initialResources.forEach(resource => {
      if (resource.CategoryPath && resource.CategoryPath.length > 0) {
        // First check CategoryPath which contains the structured hierarchy
        resource.CategoryPath.forEach(catPath => {
          if (catPath.level1 === type && catPath.level2) {
            // Format the subcategory name properly
            const formatted = catPath.level2
              .replace(/-/g, ' ')
              .replace(/\b(\w)/g, (letter) => letter.toUpperCase());
            values.add(formatted);
          }
        });
      } else if (resource.categories && resource.categories.length > 0) {
        // Fallback to categories if CategoryPath isn't available
        resource.categories.forEach(categoryRelation => {
          const category = categoryRelation.category;
          
          // Check if the category path starts with our type or matches directly
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

  // Add this function to extract level2 categories by their level1 type
  const getLevel2CategoriesByType = (level1Type: string): string[] => {
    const values = new Set<string>();
    
    initialResources.forEach(resource => {
      if (resource.CategoryPath && resource.CategoryPath.length > 0) {
        resource.CategoryPath.forEach(catPath => {
          if (catPath.level1 === level1Type && catPath.level2) {
            const formatted = catPath.level2
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
            values.add(formatted);
          }
        });
      }
    });
    
    return Array.from(values).sort();
  };

  // Get all available level1 categories (excluding university which we already handle)
  const getLevel1Categories = (): string[] => {
    const values = new Set<string>();
    
    initialResources.forEach(resource => {
      if (resource.CategoryPath && resource.CategoryPath.length > 0) {
        resource.CategoryPath.forEach(catPath => {
          if (catPath.level1 && catPath.level1 !== 'university') {
            values.add(catPath.level1);
          }
        });
      }
    });
    
    return Array.from(values).sort();
  };

  // Use database data for filter groups and remove academic levels
  const filterGroups: FilterGroup[] = [
    {
      id: 'type',
      name: 'Product Type',
      options: allProductTypes.length > 0 ? allProductTypes : getCategoriesByType('product-type'),
    },
    {
      id: 'university',
      name: 'University',
      options: allUniversities.length > 0 ? allUniversities : getCategoriesByType('university'),
    }
    // Academic levels filter removed as requested
  ];

  // Get unique categories for category filter
  const categories = ["All", ...Array.from(new Set(
    initialResources.flatMap(resource => resource.tags)
  ))];

  // We no longer need to count active filters in a useEffect as we calculate it directly when declaring the activeFiltersCount constant

  // Filter function using URL parameters
  const applyFilters = () => {
    let filtered = [...initialResources];
    
    // Filter by search term
    if (querySearch) {
      const search = querySearch.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(search) ||
        resource.description.toLowerCase().includes(search) ||
        resource.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Filter by category
    if (queryCategory && queryCategory !== "All") {
      filtered = filtered.filter(resource => 
        resource.tags.includes(queryCategory)
      );
    }
    
    // Filter by product type - now with proper name normalization
    if (queryType) {
      // Normalize the query product type for comparison
      const normalizedQueryType = queryType.toLowerCase().replace(/\s+/g, '-');
      
      filtered = filtered.filter(resource => {
        // Direct match against resource type
        if (resource.type === queryType) {
          return true;
        }
        
        // Check CategoryPath for product-type entries
        if (resource.CategoryPath && resource.CategoryPath.length > 0) {
          for (const catPath of resource.CategoryPath) {
            if (catPath.level1 === 'product-type' && catPath.level2) {
              // Direct match against slug
              if (catPath.level2 === normalizedQueryType) {
                return true;
              }
              
              // Match against formatted product type
              const formattedType = catPath.level2
                .replace(/-/g, ' ')
                .replace(/\b(\w)/g, (l: string) => l.toUpperCase());
                
              if (formattedType === queryType) {
                return true;
              }
            }
          }
        }
        
        // Check in category data
        if (resource.categories && resource.categories.length > 0) {
          for (const cat of resource.categories) {
            if (cat.category.name === queryType) {
              return true;
            }
            
            // Check if path starts with product-type
            if (cat.category.path?.startsWith('product-type/')) {
              const pathParts = cat.category.path.split('/');
              if (pathParts.length >= 2) {
                const typeSlug = pathParts[1];
                const formattedType = typeSlug
                  .replace(/-/g, ' ')
                  .replace(/\b(\w)/g, (l: string) => l.toUpperCase());
                  
                if (formattedType === queryType) {
                  return true;
                }
              }
            }
          }
        }
        
        // Check in tags
        return resource.tags.includes(queryType);
      });
    }
    
    // Filter by university - now with proper name normalization
    if (queryUniversity) {
      // Normalize the query university name for comparison with slug-based data
      const normalizedQueryUniversity = normalizeForComparison(queryUniversity);
      
      filtered = filtered.filter(resource => {
        // Check in CategoryPath - most reliable method
        if (resource.CategoryPath && resource.CategoryPath.length > 0) {
          for (const catPath of resource.CategoryPath) {
            // Match by level1/level2 structure
            if (catPath.level1 === 'university' && catPath.level2) {
              // Direct match against level2
              if (catPath.level2 === normalizedQueryUniversity) {
                return true;
              }
              
              // Match against formatted university name
              const formattedPathUniversity = catPath.level2
                .replace(/-/g, ' ')
                .replace(/\b(\w)/g, (l: string) => l.toUpperCase());
                
              if (formattedPathUniversity === queryUniversity) {
                return true;
              }
              
              // Handle "University of X" vs "X University" format differences
              if (queryUniversity.startsWith('University of ')) {
                const withoutPrefix = queryUniversity.replace('University of ', '');
                if (formattedPathUniversity.includes(withoutPrefix)) {
                  return true;
                }
              } else if (queryUniversity.endsWith(' University')) {
                const withoutSuffix = queryUniversity.replace(' University', '');
                if (formattedPathUniversity.includes(withoutSuffix)) {
                  return true;
                }
              }
            }
          }
        }
        
        // Fallback to categories
        if (resource.categories && resource.categories.length > 0) {
          for (const cat of resource.categories) {
            if (cat.category.name === queryUniversity) {
              return true;
            }
            
            // Check if the path matches university structure
            if (cat.category.path?.startsWith('university/')) {
              const pathParts = cat.category.path.split('/');
              if (pathParts.length >= 2) {
                const uniSlug = pathParts[1];
                const formattedUni = uniSlug
                  .replace(/-/g, ' ')
                  .replace(/\b(\w)/g, (l: string) => l.toUpperCase());
                  
                if (formattedUni === queryUniversity) {
                  return true;
                }
              }
            }
          }
        }
        
        // Fallback to tags
        return resource.tags.includes(queryUniversity);
      });
    }
    
    // Level filter has been removed as requested
    
    // Apply sorting
    switch (querySort) {
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
      case "price-low":
        filtered.sort((a, b) => a.finalPrice - b.finalPrice);
        break;
      case "price-high":
        filtered.sort((a, b) => b.finalPrice - a.finalPrice);
        break;
      default:
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    
    return filtered;
  };

  // Apply filters when URL parameters change
  useEffect(() => {
    const filtered = applyFilters();
    setProducts(filtered);
  }, [searchParams, initialResources]);

  // Get filtered resources directly
  const filteredResources = products;

  // Sort options for the dropdown
  const sortOptions = [
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ];

  // Function to update URL query parameters
  const updateURLParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Update or remove each parameter
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    // Create the new URL with updated parameters
    const url = `${pathname}?${newParams.toString()}`;
    router.push(url, { scroll: false });
  };
  
  // Normalize a display name to be comparable with a slug form
  const normalizeForComparison = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .replace(/\s+university$/i, '') // Remove trailing "university"
      .replace(/university\s+of\s+/i, '') // Remove leading "university of"
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  // Add debug filter function for development
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

  // Update filter handlers to use URL parameters
  const handleFilterChange = (filterId: FilterKey, value: string) => {
    // Toggle the filter (if already selected, remove it)
    const newValue = selectedFilters[filterId] === value ? "" : value;
    
    // Update URL with the new filter
    updateURLParams({ [filterId]: newValue });
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };
  
  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    updateURLParams({ category: category === "All" ? "" : category });
    // Reset to first page when category changes
    setCurrentPage(1);
  };
  
  // Handle search term change
  const handleSearchChange = (term: string) => {
    // Debounce search to avoid too many URL updates
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      updateURLParams({ search: term });
      // Reset to first page when search changes
      setCurrentPage(1);
    }, 300);
  };
  
  // Handle sort change
  const handleSortChange = (sort: string) => {
    updateURLParams({ sort });
    // Reset to first page when sort changes
    setCurrentPage(1);
  };
  
  // Handle view mode change
  const handleViewModeChange = (view: 'grid' | 'list') => {
    updateURLParams({ view });
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
  };

  // Grid item renderer
  const renderGridItem = (resource: Resource) => (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 rounded-xl">
        <div className="relative overflow-hidden h-48">
          {resource.images && resource.images.length > 0 ? (
            <ProductCardGallery 
              images={resource.images} 
              title={resource.title} 
              aspectRatio="video"
            />
          ) : (
            <img
              src={resource.image || "/placeholder-image.jpg"}
              alt={resource.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          )}
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
          
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 overflow-hidden text-ellipsis">{resource.title}</h3>
          
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
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{resource.description}</p>
        </CardContent>
        
        <CardFooter className="border-t pt-4 bg-gray-50/30">
          <div className="w-full flex items-center justify-between">
            <div>
              {resource.hasDiscount ? (
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-primary">${resource.finalPrice}</span>
                  <span className="text-xs text-gray-500 line-through">${resource.price}</span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">${resource.price}</span>
              )}
              {resource.monthlyPrice > 0 && (
                <span className="text-xs text-gray-600 block mt-0.5">or ${resource.monthlyPrice}/month</span>
              )}
            </div>
            
            <Link href={`/products/${generateProductSlug(resource)}`}>
              <Button size="sm" className="shadow-sm hover:shadow transition-all duration-200 font-medium px-4 py-2">View Details</Button>
            </Link>
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
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 rounded-xl">
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-1/4 h-48 md:h-48 overflow-hidden flex-shrink-0">
            {resource.images && resource.images.length > 0 ? (
              <ProductCardGallery 
                images={resource.images} 
                title={resource.title}
                className="h-full"
              />
            ) : (
              <img
                src={resource.image || "/placeholder-image.jpg"}
                alt={resource.title}
                className="h-full w-full object-cover"
              />
            )}
            {resource.hasDiscount && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                {resource.discountPercent}% OFF
              </Badge>
            )}
          </div>
          
          <div className="flex-1 p-5 flex flex-col min-w-0">
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
              <div>
                {resource.hasDiscount ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">${resource.finalPrice}</span>
                    <span className="text-sm text-gray-400 line-through">
                      ${resource.price}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-gray-900">${resource.price}</span>
                )}
                
                {resource.monthlyPrice > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    or ${resource.monthlyPrice}/month
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{resource.duration}</span>
                </div>
                
                <Link href={`/products/${generateProductSlug(resource)}`}>
                  <Button size="sm" className="shadow-sm hover:shadow transition-all duration-200 font-medium">View Details</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Render active filters using URL parameters
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(selectedFilters).filter(([_, value]) => value !== "");
    
    if (activeFilters.length === 0 && queryCategory === "All" && !querySearch) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Active filters:</span>
        
        {queryCategory !== "All" && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
            {queryCategory}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => handleCategoryChange("All")}
            />
          </Badge>
        )}
        
        {querySearch && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
            Search: {querySearch}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => updateURLParams({ search: "" })}
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
    <div className="w-full bg-gray-50 pb-16 pt-8">
      {/* Main grid layout with side menu on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Side menu with filters - only showing product types */}
        <div className="hidden lg:block">
          {/* Universities Filter Section */}
          <div className="bg-white p-6 rounded-xl shadow-md h-fit sticky top-4 mb-4 border border-gray-100">
            <h3 className="font-semibold text-base text-gray-900 mb-6 flex items-center"><span className="w-1.5 h-5 bg-primary rounded mr-2"></span>Universities</h3>
            
            <div className="space-y-1">
              <button 
                onClick={() => handleFilterChange('university', "")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                  queryUniversity === "" 
                    ? "bg-gray-100 font-medium text-gray-900" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span>All Universities</span>
                <span className="text-xs text-gray-500">{initialResources.length}</span>
              </button>
              
              {/* University list from database */}
              {allUniversities.map(university => {
                // Count resources for this university using the same advanced matching logic
                const normalizedUniversity = normalizeForComparison(university);
                const count = initialResources.filter(resource => {
                  // Check CategoryPath first
                  if (resource.CategoryPath && resource.CategoryPath.length > 0) {
                    for (const catPath of resource.CategoryPath) {
                      if (catPath.level1 === 'university' && catPath.level2) {
                        // Direct slug match
                        if (catPath.level2 === normalizedUniversity) return true;
                        
                        // Format match
                        const formattedUni = catPath.level2
                          .replace(/-/g, ' ')
                          .replace(/\b(\w)/g, (l: string) => l.toUpperCase());
                        if (formattedUni === university) return true;
                        
                        // Handle format variations (University of X vs X University)
                        if (university.startsWith('University of ')) {
                          const withoutPrefix = university.replace('University of ', '');
                          if (formattedUni.includes(withoutPrefix)) return true;
                        } else if (university.endsWith(' University')) {
                          const withoutSuffix = university.replace(' University', '');
                          if (formattedUni.includes(withoutSuffix)) return true;
                        }
                      }
                    }
                  }
                  
                  // Then check categories
                  if (resource.categories?.some(cat => cat.category.name === university)) return true;
                  
                  // Finally check tags
                  return resource.tags.includes(university);
                }).length;
                
                return (
                  <Link key={university} href={{ pathname: '/products', query: { university } }}>
                    <button
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                        queryUniversity === university 
                          ? "bg-gray-100 font-medium text-gray-900" 
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <span className="truncate pr-2">{university}</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Product Type Section - Only showing if level1 contains "product type" */}
          <div className="bg-white p-6 rounded-xl shadow-md h-fit mb-4 border border-gray-100">
            <h3 className="font-semibold text-base text-gray-900 mb-4 flex items-center"><span className="w-1.5 h-5 bg-primary rounded mr-2"></span>Product Type</h3>
            <div className="space-y-1">
              <button 
                onClick={() => handleFilterChange('type', "")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  queryType === "" 
                    ? "bg-gray-100 font-medium text-gray-900" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                All Types
              </button>
              
              {/* Show product types from database */}
              {allProductTypes.map(type => {
                // Count resources for this product type using normalized matching
                const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
                const count = initialResources.filter(resource => {
                  // Direct match with resource type
                  if (resource.type === type) return true;
                  
                  // Check CategoryPath for product-type entries
                  if (resource.CategoryPath && resource.CategoryPath.length > 0) {
                    for (const catPath of resource.CategoryPath) {
                      if (catPath.level1 === 'product-type' && catPath.level2) {
                        // Direct slug match
                        if (catPath.level2 === normalizedType) return true;
                        
                        // Format match
                        const formattedType = catPath.level2
                          .replace(/-/g, ' ')
                          .replace(/\b(\w)/g, (l: string) => l.toUpperCase());
                        if (formattedType === type) return true;
                      }
                    }
                  }
                  
                  // Check categories
                  if (resource.categories?.some(cat => cat.category.name === type)) return true;
                  
                  // Check tags
                  return resource.tags.includes(type);
                }).length;
                
                return (
                  <button
                    key={type}
                    onClick={() => handleFilterChange('type', type)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                      queryType === type 
                        ? "bg-gray-100 font-medium text-gray-900" 
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <span className="truncate pr-2">{type}</span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Main content area - All content in a single column */}
        <div className="lg:col-span-3">
          {/* Search and Category bar */}
          <div>
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/70" />
                <Input
                  type="text"
                  placeholder="Search study resources..."
                  className="pl-12 pr-4 py-6 w-full rounded-full text-base border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all bg-white"
                  value={querySearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              
              <Button 
                variant={showFilterPanel ? "default" : "outline"}
                size="lg"
                className="md:w-auto flex items-center justify-between gap-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span className="font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 bg-white text-primary h-6 w-6 p-0 flex items-center justify-center text-xs rounded-full">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* Category filter tabs */}
            <div className="flex flex-wrap gap- overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                    queryCategory === category
                      ? "bg-primary text-white ring-2 ring-primary/20"
                      : "bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Controls section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-3 md:mb-0">
              <p className="text-sm font-medium text-gray-700">
                Showing <span className="font-semibold text-primary">{filteredResources.length}</span> of {initialResources.length} resources
              </p>
            </div>
              
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm">
                    <span className="font-medium">Sort: <span className="text-primary">{sortOptions.find(opt => opt.value === querySort)?.label}</span></span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <div className="flex flex-col">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        className={cn(
                          "px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors",
                          querySort === option.value && "bg-primary/10 font-medium"
                        )}
                        onClick={() => handleSortChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* View mode toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button
                  className={`p-2.5 transition-all duration-200 ${queryView === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => handleViewModeChange('grid')}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  className={`p-2.5 transition-all duration-200 ${queryView === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => handleViewModeChange('list')}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Resources display with pagination */}
          <div>
            {filteredResources.length > 0 ? (
              <>
                {queryView === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map(resource => renderGridItem(resource))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {filteredResources
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map(resource => renderListItem(resource))}
                  </div>
                )}
                
                {/* Pagination controls */}
                {filteredResources.length > itemsPerPage && (
                  <div className="flex justify-center mt-8 mb-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border-gray-200 hover:bg-gray-50"
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.ceil(filteredResources.length / itemsPerPage) }, (_, i) => i + 1)
                        .filter(pageNum => {
                          const maxPages = Math.ceil(filteredResources.length / itemsPerPage);
                          // Show first, last, current and pages adjacent to current
                          return pageNum === 1 || 
                                 pageNum === maxPages || 
                                 (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                        })
                        .map((pageNum, index, array) => {
                          // Show ellipsis when pages are skipped
                          const prevPage = array[index - 1];
                          const showEllipsisBefore = index > 0 && pageNum - prevPage > 1;
                          
                          return (
                            <React.Fragment key={pageNum}>
                              {showEllipsisBefore && (
                                <span className="px-3 py-2 text-gray-400">...</span>
                              )}
                              <Button 
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center p-0 ${currentPage === pageNum ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                {pageNum}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredResources.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(filteredResources.length / itemsPerPage)}
                        className="px-4 py-2 bg-white border-gray-200 hover:bg-gray-50"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                <p className="text-gray-500 mb-2">No resources found with the selected filters.</p>
                <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or search term.</p>
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="bg-white hover:bg-gray-50 shadow-sm"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 