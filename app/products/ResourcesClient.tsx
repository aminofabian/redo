"use client";

import React, { useState, useEffect } from "react";
import { Star, BookOpen, Clock, Users, Grid, List, ChevronDown, SlidersHorizontal, X, Search, Package, Plus } from "lucide-react";
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
import { useCart, getDiscountRate, getDiscountPercentage } from "@/lib/CartContext";
import { toast } from "react-hot-toast";
import { CartSidebar } from "@/components/ui/CartSidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";

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
  categories?: { category: { name: string; path?: string; slug?: string } }[];
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

// Function to extract university from any resource using all available sources
function getResourceUniversity(resource: Resource): string | null {
  try {
    // PRIMARY METHOD: Check CategoryPath model (matches your DB schema)
    // According to schema.prisma, CategoryPath has level1, level2, etc. fields
    if (resource.CategoryPath && resource.CategoryPath.length > 0) {
      // First check for direct university entries
      for (const catPath of resource.CategoryPath) {
        if (catPath.level1 === 'university' && catPath.level2) {
          // Format the university name nicely for display
          return catPath.level2
            .replace(/-/g, ' ')
            .replace(/\b(\w)/g, (char: string) => char.toUpperCase());
        }
      }
      
      // Also check other levels that might contain university info
      for (const catPath of resource.CategoryPath) {
        // Check the path field directly
        if (catPath.path?.includes('university/')) {
          const pathParts = catPath.path.split('/');
          for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'university' && i + 1 < pathParts.length) {
              return pathParts[i + 1]
                .replace(/-/g, ' ')
                .replace(/\b(\w)/g, (char: string) => char.toUpperCase());
            }
          }
        }
        
        // Check if any level has university in it
        for (let i = 1; i <= 5; i++) {
          const levelValue = catPath[`level${i}` as keyof typeof catPath] as string | undefined;
          if (levelValue && (
              levelValue.toLowerCase().includes('university') || 
              levelValue.toLowerCase().includes('college'))) {
            return levelValue
              .replace(/-/g, ' ')
              .replace(/\b(\w)/g, (char: string) => char.toUpperCase());
          }
        }
      }
    }
    
    // SECONDARY METHOD: Check categories collection (traditional category structure)
    if (resource.categories && resource.categories.length > 0) {
      for (const cat of resource.categories) {
        // Check category path format (from Category model)
        if (cat.category.path?.includes('university/')) {
          const pathParts = cat.category.path.split('/');
          for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'university' && i + 1 < pathParts.length) {
              return pathParts[i + 1]
                .replace(/-/g, ' ')
                .replace(/\b(\w)/g, (char: string) => char.toUpperCase());
            }
          }
        }
        
        // Check category name directly
        if (cat.category.name?.toLowerCase().includes('university') || 
            cat.category.name?.toLowerCase().includes('college')) {
          return cat.category.name;
        }
        
        // Check category slug
        if (cat.category.slug?.toLowerCase().includes('university') || 
            cat.category.slug?.toLowerCase().includes('college')) {
          return cat.category.slug
            .replace(/-/g, ' ')
            .replace(/\b(\w)/g, (char: string) => char.toUpperCase());
        }
      }
    }
    
    // TERTIARY METHOD: Check direct university property
    if (resource.university) {
      return resource.university;
    }
    
    // Check product title for university name
    if (resource.title) {
      // Common university names to look for in the title
      const uniKeywords = [
        'university', 'college', 'institute', 'school'
      ];
      
      for (const keyword of uniKeywords) {
        if (resource.title.toLowerCase().includes(keyword)) {
          // Try to extract university name from title
          const titleWords = resource.title.split(' ');
          let uniIndex = -1;
          
          // Find the keyword in the title
          for (let i = 0; i < titleWords.length; i++) {
            if (titleWords[i].toLowerCase().includes(keyword)) {
              uniIndex = i;
              break;
            }
          }
          
          if (uniIndex >= 0) {
            // Try to construct university name - take up to 3 words before and the keyword
            const start = Math.max(0, uniIndex - 3);
            const possibleUni = titleWords.slice(start, uniIndex + 1).join(' ');
            if (possibleUni.length > 5) { // Ensure it's not too short
              return possibleUni;
            }
          }
        }
      }
    }
    
    // FALLBACK: Check tags for university names
    if (resource.tags && resource.tags.length > 0) {
      for (const tag of resource.tags) {
        if (tag.toLowerCase().includes('university') || 
            tag.toLowerCase().includes('college')) {
          return tag;
        }
      }
    }
    
    // LAST RESORT: Use parent category or default
    if (resource.categories && resource.categories.length > 0) {
      // Just pick the first available category as better than nothing
      const firstCategory = resource.categories[0].category.name;
      if (firstCategory) {
        return firstCategory;
      }
    }
    
    // If absolutely nothing found, return a generic label
    return "Academic Resource";
    
  } catch (error) {
    console.error("Error in getResourceUniversity:", error);
    return "Academic Resource"; // Return a default value on error
  }
}

export default function ResourcesClient({ initialResources, allUniversities, allProductTypes }: ResourcesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchTimeout = React.useRef<NodeJS.Timeout>();
  const { currentPackage, addToPackage, completePackage, removeFromPackage } = useCart();
  
  // Get filter values from URL query parameters
  const queryType = searchParams.get('type') || "";
  const queryUniversity = searchParams.get('university') || "";
  const queryLevel = searchParams.get('level') || "";
  const queryCategory = searchParams.get('category') || "All";
  const querySearch = searchParams.get('search') || "";
  const querySort = searchParams.get('sort') || "popular";
  const queryView = (searchParams.get('view') as 'grid' | 'list') || 'grid';
  // Get page from URL query parameters
  const queryPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Local UI state
  const [products, setProducts] = useState<Resource[]>(initialResources);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
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
    const universitySet = new Set<string>();
    
    // First, use the list passed from the server if available
    if (allUniversities && allUniversities.length > 0) {
      allUniversities.forEach(uni => universitySet.add(uni));
      return Array.from(universitySet).sort();
    }
    
    // Otherwise extract from resources (as fallback)
    initialResources.forEach(resource => {
      // Try to extract from CategoryPath first
      if (resource.CategoryPath && resource.CategoryPath.length > 0) {
        resource.CategoryPath.forEach(catPath => {
          // Look for university in level1 and level2
          if (catPath.level1 === 'university' && catPath.level2) {
            // Just use the display name if available, or basic capitalization if not
            if (resource.university) {
              universitySet.add(resource.university);
            } else {
              // Simple capitalization without reformatting
              const displayName = catPath.level2
                .replace(/-/g, ' ')
                .replace(/\b(\w)/g, (char) => char.toUpperCase());
              universitySet.add(displayName);
            }
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
              
              // Use the exact category name without reformatting
              universitySet.add(category.name);
            }
          }
        });
      }
      
      // Directly use the university field if present
      if (resource.university) {
        universitySet.add(resource.university);
      }
    });
    
    // Add fallback universities if we don't have many
    if (universitySet.size < 5) {
      const fallbackUniversities = [
        'University of Hawaii',
        'University of Iowa',
        'University of Columbia',
        'Chamberlain University',
        'Walden University',
        'Johns Hopkins University'
      ];
      
      fallbackUniversities.forEach(uni => universitySet.add(uni));
    }
    
    return Array.from(universitySet).sort();
  };

  // Helper function to check if a product is already in the current package
  const isProductInPackage = (resource: Resource): boolean => {
    if (!currentPackage.size || !currentPackage.items.length) return false;
    return currentPackage.items.some(item => item.id === Number(resource.id));
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
  
  // Function to extract university name from a resource
  const getResourceUniversity = (resource: Resource): string => {
    // 1. Check direct university property
    if (resource.university) {
      return resource.university;
    }
    
    // 2. Check CategoryPath
    if (resource.CategoryPath && resource.CategoryPath.length > 0) {
      for (const catPath of resource.CategoryPath) {
        if (catPath.level1 === 'university' && catPath.level2) {
          // Format the university name nicely
          return catPath.level2
            .replace(/-/g, ' ')
            .replace(/\b(\w)/g, (char) => char.toUpperCase())
            .replace(/University Of/i, 'University of');
        }
      }
    }
    
    // 3. Check categories array for university paths
    if (resource.categories && resource.categories.length > 0) {
      for (const cat of resource.categories) {
        if (cat.category.path?.startsWith('university/')) {
          // Extract university name from path
          const uniSlug = cat.category.path.split('/')[1];
          if (uniSlug) {
            return uniSlug
              .replace(/-/g, ' ')
              .replace(/\b(\w)/g, (char) => char.toUpperCase())
              .replace(/University Of/i, 'University of');
          }
        }
      }
    }
    
    return "";
  };

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
    
    // Filter by university using consistent matching with display logic
    if (queryUniversity) {
      console.log(`Filtering for university: "${queryUniversity}"`);
      
      // First try exact category path matching
      let exactMatches = filtered.filter(resource => {
        // 1. Check categories for the proper university path format
        if (resource.categories && resource.categories.length > 0) {
          for (const cat of resource.categories) {
            // Check for paths like "university/walden-university"
            if (cat.category.path) {
              const expectedPath = `university/${queryUniversity}`;
              // Direct match or starts with (to handle subcategories)
              if (cat.category.path === expectedPath || 
                  cat.category.path.startsWith(`${expectedPath}/`)) {
                return true;
              }
            }
          }
        }
        
        // 2. Also check CategoryPath (newer format)
        if (resource.CategoryPath && resource.CategoryPath.length > 0) {
          for (const catPath of resource.CategoryPath) {
            if (catPath.level1 === 'university' && catPath.level2 === queryUniversity) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      // If no exact matches, use flexible matching like in the display logic
      if (exactMatches.length === 0) {
        // Extract key parts of university name for matching
        const uniParts = queryUniversity.split('-').filter(part => 
          part.length > 3 && !['university', 'college', 'of'].includes(part)
        );
        
        // Use the flexible matching
        exactMatches = filtered.filter(resource => {
          // Stringify resource for full-text search
          const resourceStr = JSON.stringify(resource).toLowerCase();
          
          // Check for key university name parts
          for (const part of uniParts) {
            if (resourceStr.includes(part.toLowerCase())) {
              return true;
            }
          }
          
          return false;
        });
      }
      
      // Use the filtered results
      filtered = exactMatches;
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
    // Build the query string by merging existing and new parameters
    const updatedParams = new URLSearchParams(searchParams.toString());
    
    // Update or delete params based on their values
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        updatedParams.set(key, value);
      } else {
        updatedParams.delete(key);
      }
    });

    // Reset page to 1 when changing filters, unless page is the parameter being updated
    if (!params.hasOwnProperty('page')) {
      updatedParams.set('page', '1');
    }
    
    // Only navigate if there are actual changes
    const newURL = `${pathname}?${updatedParams.toString()}`;
    router.push(newURL, { scroll: false });
  };
  
  // Normalize a display name to be comparable with a slug form
  // This function is used for COMPARISON only, not for display
  const normalizeForComparison = (displayName: string): string => {
    // Ensure we're only using this for comparison, not changing display names
    console.log(`Normalizing for comparison: "${displayName}"`);
    
    const normalized = displayName
      .toLowerCase()
      .replace(/\s+university$/i, '') // Remove trailing "university"
      .replace(/university\s+of\s+/i, '') // Remove leading "university of"
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
      
    console.log(`Normalized to: "${normalized}"`);
    return normalized;
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
    
    // Debug log for filter changes
    console.log(`Changing filter ${filterId} to: "${newValue}"`);
    
    // Update URL with the new filter
    updateURLParams({ [filterId]: newValue });
  };
  
  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    updateURLParams({ category: category === "All" ? "" : category });
  };
  
  // Handle search term change
  const handleSearchChange = (term: string) => {
    // Debounce search to avoid too many URL updates
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      updateURLParams({ search: term });
    }, 300);
  };
  
  // Handle sort change
  const handleSortChange = (sort: string) => {
    updateURLParams({ sort });
  };
  
  // Handle view mode change
  const handleViewModeChange = (view: 'grid' | 'list') => {
    updateURLParams({ view });
  };
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    updateURLParams({
      page: pageNumber.toString()
    });
    // Scroll to the top of the product list
    window.scrollTo({
      top: document.querySelector('.resources-filter-bar')?.getBoundingClientRect().top as number + window.scrollY - 100,
      behavior: 'smooth'
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    updateURLParams({
      type: "",
      university: "",
      level: "",
      category: "All",
      search: "",
      sort: "popular",
      page: "1"
    });
  };

  // Grid item renderer
  const renderGridItem = (resource: Resource) => (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/products/${generateProductSlug(resource)}`} className="block h-full cursor-pointer">
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 rounded-xl bg-gradient-to-b from-white to-gray-50 group">
          <div className="relative overflow-hidden h-52 group-hover:shadow-inner">
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
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            {resource.hasDiscount && (
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium shadow-md">
                {resource.discountPercent}% OFF
              </Badge>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          <CardContent className="flex-grow pt-5 relative z-10 px-5">
            <div className="absolute -top-5 left-5 rounded-full bg-white shadow-lg p-2 border border-gray-100">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
            
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 overflow-hidden text-ellipsis group-hover:text-primary transition-colors duration-300">{resource.title}</h3>
            
            {/* University badge - always displayed for every product */}
            <div className="mb-3">
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 font-medium hover:bg-blue-100 transition-colors">
                <img src="/university-icon.svg" alt="University" className="w-4 h-4 mr-1.5" onError={(e) => {
                  e.currentTarget.src = "/placeholder-icon.svg";
                  e.currentTarget.onerror = null;
                }} />
                {getResourceUniversity(resource) || "Academic Resource"}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-1.5 my-3">
              {resource.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="bg-white shadow-sm border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                  {tag}
                </Badge>
              ))}
              {resource.tags.length > 3 && (
                <Badge variant="outline" className="bg-white shadow-sm border-gray-200">+{resource.tags.length - 3}</Badge>
              )}
            </div>
        
            <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{resource.description}</p>
          </CardContent>
          
          <CardFooter className="border-t pt-4 bg-gradient-to-r from-gray-50 to-white">
            <div className="w-full flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  {resource.hasDiscount ? (
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-green-600">
                        ${typeof resource.finalPrice === 'string' ? parseFloat(resource.finalPrice).toFixed(2) : resource.finalPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ${typeof resource.price === 'string' ? parseFloat(resource.price).toFixed(2) : resource.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-800">
                      ${typeof resource.price === 'string' ? parseFloat(resource.price).toFixed(2) : resource.price.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <Link href={`/products/${generateProductSlug(resource)}`}>
                  <Button size="sm" className="shadow-md hover:shadow-lg transition-all duration-200 font-medium px-4 py-2 rounded-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90" onClick={(e) => { e.stopPropagation(); e.preventDefault(); router.push(`/products/${generateProductSlug(resource)}`); }}>
                    View Details
                  </Button>
                </Link>
              </div>
              
              {/* Add to Bundle button */}
              {currentPackage.size !== null && (
                <Button
                  variant={isProductInPackage(resource) ? "outline" : "default"}
                  size="sm"
                  className={`w-full group relative overflow-hidden transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${isProductInPackage(resource) 
                    ? 'bg-green-50 text-green-700 border-green-300 cursor-not-allowed font-medium'
                    : currentPackage.items.length >= (currentPackage.size || 0)
                    ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-transparent hover:shadow-md font-medium'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isProductInPackage(resource) && currentPackage.size !== null && currentPackage.items.length < currentPackage.size) {
                      addToPackage({
                        id: Number(resource.id),
                        title: resource.title,
                        price: resource.finalPrice || resource.price,
                        image: resource.images?.[0]?.url || resource.image,
                        type: resource.type
                      });
                      toast.success(`Added ${resource.title} to your bundle`);
                    }
                  }}
                  disabled={isProductInPackage(resource) || currentPackage.size !== null && currentPackage.items.length >= (currentPackage.size || 0)}
                >
                  <span className="relative z-10 flex items-center font-medium">
                    {isProductInPackage(resource) ? (
                      <>
                        <Package size={18} className="mr-1.5" />
                        <span>Already in Bundle</span>
                      </>
                    ) : currentPackage.size !== null && currentPackage.items.length >= currentPackage.size ? (
                      <>
                        <span className="font-semibold">Bundle Full</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="mr-1.5" />
                        <span className="font-semibold">Add to Bundle</span>
                        <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-sm text-xs">{currentPackage.items.length}/{currentPackage.size}</span>
                      </>
                    )}
                  </span>
                  {!isProductInPackage(resource) && currentPackage.size !== null && currentPackage.items.length < currentPackage.size && (
                    <>
                      <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-400/20 to-transparent group-hover:from-indigo-400/30 transition-all duration-300"></span>
                      <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
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
      <Link href={`/products/${generateProductSlug(resource)}`} className="block cursor-pointer">
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 rounded-xl bg-gradient-to-r from-white to-gray-50 group">
          <div className="flex flex-col md:flex-row relative">
            <div className="relative md:w-1/3 h-48 md:h-auto overflow-hidden flex-shrink-0">
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
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {resource.hasDiscount && (
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium shadow-md py-1 px-2.5">
                  {resource.discountPercent}% OFF
                </Badge>
              )}
            </div>
            
            <div className="flex-1 p-6 flex flex-col min-w-0 relative">
              <div className="absolute right-6 top-6">
                <div className="bg-yellow-50 rounded-full border border-yellow-200 p-1.5 shadow-sm">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              
              <h3 className="font-semibold text-xl mb-2 pr-10 group-hover:text-primary transition-colors duration-300">{resource.title}</h3>
              
              {/* University badge - always displayed for every product */}
              <div className="mb-3">
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 font-medium hover:bg-blue-100 transition-colors">
                  <img src="/university-icon.svg" alt="University" className="w-4 h-4 mr-1.5" onError={(e) => {
                    e.currentTarget.src = "/placeholder-icon.svg";
                    e.currentTarget.onerror = null;
                  }} />
                  {getResourceUniversity(resource) || "Academic Resource"}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1.5 my-3">
                {resource.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-white shadow-sm border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <p className="text-gray-600 my-3 line-clamp-2 flex-grow leading-relaxed">{resource.description}</p>
              
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {resource.duration && (
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full shadow-sm border border-blue-100">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{resource.duration}</span>
                      </div>
                    )}
                    {resource.chapters && (
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-medium">{resource.chapters}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div>
                      {resource.hasDiscount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-green-600">
                            ${typeof resource.finalPrice === 'string' ? parseFloat(resource.finalPrice).toFixed(2) : resource.finalPrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            ${typeof resource.price === 'string' ? parseFloat(resource.price).toFixed(2) : resource.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-gray-800">
                          ${typeof resource.price === 'string' ? parseFloat(resource.price).toFixed(2) : resource.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <Link href={`/products/${generateProductSlug(resource)}`}>
                      <Button size="sm" className="shadow-md hover:shadow-lg transition-all duration-200 font-medium px-4 py-2 rounded-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90" onClick={(e) => { e.stopPropagation(); e.preventDefault(); router.push(`/products/${generateProductSlug(resource)}`); }}>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
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
    
    // Debug all universities
    console.log(`Total universities to render: ${allUniversities.length}`, allUniversities);
    allUniversities.forEach((uni, index) => {
      console.log(`University ${index+1}/${allUniversities.length}: "${uni}"`);
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
              
              {/* University list from database - show ALL universities */}
              {allUniversities.map((university, index) => {
                // University is now a raw string value directly from the database (level2)
                // No processing or formatting needed - display exactly as is
                const exactDbValue = university;
                
                // First, try strict matching on category paths
                let exactMatches = initialResources.filter(resource => {
                  // Check if resource has the correct category path for this university
                  if (resource.categories && resource.categories.length > 0) {
                    for (const cat of resource.categories) {
                      // Check for paths like "university/walden-university"
                      if (cat.category.path) {
                        const expectedPath = `university/${university}`;
                        // Direct match or starts with (to handle subcategories)
                        if (cat.category.path === expectedPath || 
                            cat.category.path.startsWith(`${expectedPath}/`)) {
                          return true;
                        }
                      }
                    }
                  }
                  
                  // Also check CategoryPath (newer format)
                  if (resource.CategoryPath && resource.CategoryPath.length > 0) {
                    for (const catPath of resource.CategoryPath) {
                      if (catPath.level1 === 'university' && catPath.level2 === university) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                });
                
                // If no exact matches, use a more flexible approach for display purposes
                if (exactMatches.length === 0) {
                  // Extract key parts of the university name for flexible matching
                  const uniParts = university.split('-').filter(part => part.length > 3 && 
                                                                   !['university', 'college', 'of'].includes(part));
                  
                  // Do a more flexible search for content with these key parts
                  exactMatches = initialResources.filter(resource => {
                    // Stringify the resource data for full-text search
                    const resourceText = JSON.stringify(resource).toLowerCase();
                    
                    // Check if any key part of the university name is found
                    for (const part of uniParts) {
                      if (resourceText.includes(part.toLowerCase())) {
                        return true;
                      }
                    }
                    
                    return false;
                  }).slice(0, 5); // Limit to 5 matches for reasonable display
                }
                
                // For display purposes, ensure at least one match for every university
                const count = Math.max(exactMatches.length, 1);
                
                // Force debug log for each university
                console.log(`University ${index+1}/${allUniversities.length}: "${university}" (Products: ${count})`);
                
                // Properly encode the university name for the URL
                const encodedUniversity = encodeURIComponent(university);
                console.log(`Filter URL for ${university}: /products?university=${encodedUniversity}`);

                return (
                  <button
                    key={university}
                    onClick={() => {
                      // Apply filter programmatically using exact database value
                      handleFilterChange('university', exactDbValue); // Use the raw database value
                      console.log(`Applying university filter with exact database value: ${exactDbValue}`);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                      queryUniversity === university 
                        ? "bg-gray-100 font-medium text-gray-900" 
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <span className="truncate pr-2">
                      {/* Format the university name for display */}
                      {exactDbValue
                        .replace(/-/g, ' ')
                        .replace(/\b(\w)/g, (char) => char.toUpperCase())
                        .replace(/University Of/i, 'University of')
                      }
                    </span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Bundle Summary Section - Blue & Green Color Scheme */}
          {currentPackage.size !== null && currentPackage.items.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg h-fit mb-6 relative overflow-hidden border border-blue-200">
              {/* Blue accent top border */}
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
              
              {/* Bundle Header with package icon */}
              <div className="flex items-center justify-between mb-5 mt-1 relative">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg mr-2.5">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-800">
                    Your Bundle
                  </h3>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-sm font-bold mr-2">
                    {currentPackage.items.length}/{currentPackage.size}
                  </div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                    {getDiscountPercentage(currentPackage.size)}% OFF
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-5 relative">
                <div className="w-full h-3 bg-gray-100 rounded-md overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-md transition-all duration-500 ease-out"
                    style={{ width: `${(currentPackage.items.length / (currentPackage.size || 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1.5 px-1">
                  <span>{Math.round((currentPackage.items.length / (currentPackage.size || 1)) * 100)}% completed</span>
                  <span>{currentPackage.size - currentPackage.items.length} items left</span>
                </div>
              </div>
              
              {/* Items scroller with visible scrollbar and label */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Bundle Items</h4>
                  <span className="text-sm text-blue-500 cursor-pointer hover:underline" onClick={() => router.push('/products')}>Add more</span>
                </div>
                
                {/* Visible scrollbar container with shadow indicator */}
                <div className="relative">
                  <div className="absolute pointer-events-none inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
                  <div className="absolute pointer-events-none inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent"></div>
                  
                  <div className="border border-blue-100 rounded-lg p-2 bg-blue-50">
                    <div className="max-h-56 overflow-y-auto pr-1 scrollbar-blue">
                      {currentPackage.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No items added yet</div>
                      ) : (
                        <div className="space-y-2">
                          {currentPackage.items.map((item, idx) => (
                            <div key={idx} className="flex items-center p-3 rounded-lg bg-white border border-blue-100 hover:border-blue-300 transition-colors duration-200 shadow-sm">
                              {item.image && (
                                <div className="w-12 h-12 rounded overflow-hidden mr-3 border border-gray-200 flex-shrink-0">
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 mb-0.5 leading-tight">
                                  {item.title}
                                </p>
                                
                                {/* University information - always shown for all products */}
                                <div className="flex items-center mb-1">
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                    {(() => {
                                      // Find the original resource to get university info
                                      const fullResource = initialResources.find(r => Number(r.id) === Number(item.id));
                                      return fullResource ? (getResourceUniversity(fullResource) || "Academic Resource") : "Academic Resource";
                                    })()}
                                  </span>
                                </div> 
                                
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-500 line-through mr-2">
                                    ${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-green-600 font-semibold">
                                    ${typeof item.price === 'string' 
                                      ? (parseFloat(item.price) * (1 - getDiscountRate(currentPackage.size))).toFixed(2) 
                                      : (item.price * (1 - getDiscountRate(currentPackage.size))).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  const itemId = typeof item.id === 'string' ? parseInt(item.id) : Number(item.id);
                                  removeFromPackage(itemId);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 ml-2 border border-red-100"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pricing summary card */}
              <div className="bg-blue-50 rounded-lg p-4 mb-5 border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-blue-700">Bundle Summary</span>
                  <span className="bg-green-500 text-white px-2 py-1 rounded-md text-sm font-bold">
                    {getDiscountPercentage(currentPackage.size)}% OFF
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original price:</span>
                    <span className="font-medium text-gray-500 line-through">
                      ${(currentPackage.items.reduce(
                        (sum, item) => sum + (typeof item.price === 'string' ? parseFloat(item.price) : item.price), 0
                      )).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your savings:</span>
                    <span className="font-bold text-green-600">
                      -${(currentPackage.items.reduce(
                        (sum, item) => sum + (typeof item.price === 'string' ? parseFloat(item.price) : item.price) * getDiscountRate(currentPackage.size), 0
                      )).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-2 mt-1 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 font-medium">Bundle total:</span>
                      <span className="font-bold text-xl text-blue-600">
                        ${(currentPackage.items.reduce(
                          (sum, item) => sum + (typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (1 - getDiscountRate(currentPackage.size)), 0
                        )).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons with blue and green colors */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                  onClick={() => router.push('/products')}
                >
                  Continue Shopping
                </Button>
                
                <Button
                  variant="outline"
                  className="border-blue-200 bg-white hover:bg-blue-50 text-blue-600 font-medium"
                  onClick={() => {
                    document.querySelector('[data-cart-trigger]')?.dispatchEvent(
                      new MouseEvent('click', { bubbles: true })
                    );
                  }}
                >
                  View Cart
                </Button>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      className="col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold h-14 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl mt-2 border border-green-400 relative overflow-hidden group"
                      onClick={() => {
                        if (currentPackage.items.length === currentPackage.size) {
                          completePackage();
                        } else {
                          toast.error(`Please select all ${currentPackage.size} items to complete your bundle`);
                        }
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex flex-col items-center justify-center w-full z-10 relative">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold flex items-center">
                            <Package className="mr-2 h-4 w-4" /> Checkout Now
                          </span>
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold shadow-inner border border-white/30">
                            ${(currentPackage.items.reduce(
                              (sum, item) => sum + (typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (1 - getDiscountRate(currentPackage.size)), 0
                            )).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-white w-full text-center mt-1 bg-green-600/40 rounded-md py-0.5 px-2 backdrop-blur-sm">
                          <span className="font-semibold">{getDiscountPercentage(currentPackage.size)}% discount</span> applied
                        </div>
                      </div>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-md p-0 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-xl">
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200 shadow-sm mb-2">
                      <h2 className="font-bold text-xl text-gray-800 flex items-center">
                        <Package className="mr-2 h-5 w-5 text-primary" /> Your Cart
                      </h2>
                    </div>
                    <CartSidebar priceId="" price="0.00" description="Cart items" />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}
          

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
                      .slice((queryPage - 1) * itemsPerPage, queryPage * itemsPerPage)
                      .map(resource => renderGridItem(resource))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {filteredResources
                      .slice((queryPage - 1) * itemsPerPage, queryPage * itemsPerPage)
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
                        onClick={() => handlePageChange(Math.max(queryPage - 1, 1))}
                        disabled={queryPage === 1}
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
                                 (pageNum >= queryPage - 1 && pageNum <= queryPage + 1);
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
                                variant={queryPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center p-0 ${queryPage === pageNum ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                {pageNum}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(Math.min(queryPage + 1, Math.ceil(filteredResources.length / itemsPerPage)))}
                        disabled={queryPage === Math.ceil(filteredResources.length / itemsPerPage)}
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