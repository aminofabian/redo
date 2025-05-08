"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Package, DollarSign, Image as ImageIcon, Upload, 
  X, Link as LinkIcon, Percent, Calendar, Clock, Tag, 
  Download, Eye, Timer, Users, Infinity, ChevronRight, ChevronDown, PlusCircle, Edit, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/utils";

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onPreviewOpen?: () => void;
}

// Define the category structure type
interface CategoryItem {
  id: string;
  name: string;
  children?: CategoryItem[];
}

export function ProductDrawer({ 
  open, 
  onClose, 
  onPreviewOpen = () => {}
}: ProductDrawerProps) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isUnlimitedAccess, setIsUnlimitedAccess] = useState(false);
  const [isUnlimitedDownloads, setIsUnlimitedDownloads] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Change finalPrice to be part of formData instead of a separate state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    finalPrice: '', // New field to store the final price directly
    regularPrice: '', // This will be calculated
    discountPercent: '',
    discountType: 'percent',
    accessDuration: '',
    downloadLimit: '',
    downloadLink: '',
    link: ''
  });

  // Add a state to track if URL has been manually edited
  const [urlManuallyEdited, setUrlManuallyEdited] = useState(false);

  // Get categories from the database instead of hardcoded values
  const [categoryStructure, setCategoryStructure] = useState<CategoryItem[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  // Enhanced state for category creation
  const [newCategoryName, setNewCategoryName] = useState("");
  const [currentParentPath, setCurrentParentPath] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryType, setCategoryType] = useState<string>(""); // university, level, or product-type
  
  // Replace the flat selectedCategories with hierarchical path structure
  // Store as array of path strings like ["university/chamberlain/nr322"]
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState<string[]>([]);

  // Function to check if a category path is selected
  const isCategoryPathSelected = (path: string) => {
    return selectedCategoryPaths.includes(path);
  };

  // Function to handle category selection, preserving order of selection
  const handleCategoryPathChange = (path: string, checked: boolean) => {
    if (checked) {
      // When checking a category, add it to the end of the array to preserve selection order
      setSelectedCategoryPaths(prev => [...prev, path]);
    } else {
      // When unchecking, just remove the path
      setSelectedCategoryPaths(prev => prev.filter(p => p !== path));
    }
  };

  // Function to add a new category at any level
  const addCategory = async (parentPath: string, categoryName: string, type: string = "") => {
    if (!categoryName.trim()) return;
    
    try {
      // Find parent ID if we have a parent path
      let parentId = null;
      
      if (parentPath) {
        // Find the parent category to get its ID
        const findParentId = (items: CategoryItem[], path: string[]): string | null => {
          if (path.length === 0) return null;
          
          for (const item of items) {
            if (item.id === path[0]) {
              if (path.length === 1) return item.id;
              return findParentId(item.children || [], path.slice(1));
            }
          }
          return null;
        };
        
        const pathParts = parentPath.split('/');
        parentId = findParentId(categoryStructure, pathParts);
      }
      
      // Reset name input
      setNewCategoryName('');
      
      // Call API to create the category
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: categoryName, 
          parentId, 
          parentPath, // Send path as fallback
          type // Category type (university, level, product-type)
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add category');
      }
      
      // Refresh categories after adding
      fetchCategories();
      
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add category');
    }
  };  

  // Function to remove a category at any level
  const removeCategory = async (path: string) => {
    if (!path) return;
    
    // Split the path to get the current hierarchy
    const pathParts = path.split('/');
    
    try {
      // Find the category ID from the path
      const findCategoryId = (items: CategoryItem[], path: string[]): string | null => {
        if (path.length === 0) return null;
        
        for (const item of items) {
          if (item.id === path[0]) {
            if (path.length === 1) return item.id;
            return findCategoryId(item.children || [], path.slice(1));
          }
        }
        return null;
      };
      
      const categoryId = findCategoryId(categoryStructure, pathParts);
      
      if (!categoryId) {
        toast.error('Category not found');
        return;
      }
      
      // Call API to delete the category
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove category');
      }
      
      // Refresh categories after removal
      fetchCategories();
      
      toast.success('Category removed successfully');
    } catch (error) {
      console.error('Error removing category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove category');
    }
  };  

  // Move this function outside of CategoryTree and into the main component
  const handleAddCategory = (path: string, suggestedType: string = "") => {
    setCurrentParentPath(path);
    setCategoryType(suggestedType); // Set suggested type based on context
    setIsAddingCategory(true);
  };

  // New component for rendering category tree with modern styling
  const CategoryTree = ({ 
    items, 
    parentPath = "" 
  }: { 
    items: CategoryItem[], 
    parentPath?: string 
  }) => {
    // State to track which categories are expanded
    const [expandedItems, setExpandedItems] = useState<string[]>(["university", "product-type"]);
    
    // Function to toggle expansion state
    const toggleExpand = (itemId: string) => {
      setExpandedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId) 
          : [...prev, itemId]
      );
    };
    
    return (
      <div className="space-y-1.5">
        {items.map(item => {
          // Store the database ID path for internal operations (expand/collapse/delete)
          const idPath = parentPath ? `${parentPath}/${item.id}` : item.id;
          
          // Create the human-readable path for category selection
          // For top-level categories, use their type directly (university, product-type)
          // For sub-categories, use their name in lowercase with special chars removed
          let humanReadablePath;
          if (!parentPath) {
            // Root level - use the ID as-is (should be 'university' or 'product-type')
            humanReadablePath = item.id;
          } else if (parentPath === "university" || parentPath.startsWith("university/")) {
            // For university categories, use a consistent format
            // Format the name by converting to lowercase, removing special chars, and replacing spaces with nothing
            const formattedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            humanReadablePath = parentPath ? `${parentPath}/${formattedName}` : formattedName;
          } else if (parentPath === "product-type" || parentPath.startsWith("product-type/")) {
            // For product types, convert to lowercase, remove special chars, replace spaces with hyphens
            const formattedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '-');
            humanReadablePath = parentPath ? `${parentPath}/${formattedName}` : formattedName;
          } else {
            // Fallback for any other category
            const formattedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            humanReadablePath = parentPath ? `${parentPath}/${formattedName}` : formattedName;
          }
          
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(idPath);
            
            // Determine styles based on item type
            let itemStyles = "";
            let badgeText = "";
            let badgeStyle = "";
            
            if (item.id === "university") {
              itemStyles = "hover:bg-blue-50";
              badgeText = "Root";
              badgeStyle = "bg-blue-100 text-blue-800";
            } else if (parentPath === "university") {
              itemStyles = "hover:bg-indigo-50";
              badgeText = "School";
              badgeStyle = "bg-indigo-100 text-indigo-800";
            } else if (parentPath && parentPath.startsWith("university/")) {
              itemStyles = "hover:bg-purple-50";
              badgeText = "Course";
              badgeStyle = "bg-purple-100 text-purple-800";
            } else if (item.id === "product-type") {
              itemStyles = "hover:bg-amber-50";
              badgeText = "Root";
              badgeStyle = "bg-amber-100 text-amber-800";
            } else if (parentPath === "product-type") {
              itemStyles = "hover:bg-amber-50/50";
              badgeText = "Type";
              badgeStyle = "bg-amber-50 text-amber-800";
            }

            return (
              <div key={item.id} className="space-y-1">
                <div className={`flex items-center group rounded-md px-2 py-1.5 ${itemStyles} transition-colors duration-150`}>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(idPath)}
                      className="w-5 h-5 flex items-center justify-center mr-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                  <div className="flex items-center space-x-2 flex-1">
                    <Checkbox 
                      id={idPath}
                      checked={isCategoryPathSelected(humanReadablePath)}
                      onCheckedChange={(checked) => 
                        handleCategoryPathChange(humanReadablePath, checked as boolean)
                      }
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                    />
                    <div className="flex items-center flex-1">
                      <label
                        htmlFor={idPath}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {item.name}
                      </label>
                      
                      {/* Badge */}
                      {badgeText && (
                        <span className={`ml-2 px-1.5 py-0.5 text-[10px] ${badgeStyle} rounded-sm font-medium`}>
                          {badgeText}
                        </span>
                      )}
                      
                      {/* Show child count */}
                      {hasChildren && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          ({item.children?.length})
                        </span>
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddCategory(idPath)}
                        className="w-6 h-6 flex items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-full transition-colors"
                        title="Add subcategory"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCategory(idPath)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {isExpanded && hasChildren && (
                  <div className="pl-6 border-l border-indigo-100 ml-2 space-y-1">
                    <CategoryTree 
                      items={item.children || []} 
                      parentPath={humanReadablePath}
                    />
                  </div>
                )}
              </div>
            );
        })}
      </div>
    );
  };

  // Handle form changes locally
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track if the URL field was manually edited
    if (name === 'link') {
      setUrlManuallyEdited(true);
    }
  };

  // Auto-generate URL from title only if not manually edited
  useEffect(() => {
    if (formData.title && !urlManuallyEdited) {
      const slug = slugify(formData.title);
      
      setFormData(prev => ({
        ...prev,
        link: `www.rnstudentresources.com/products/${slug}`
      }));
    }
  }, [formData.title, urlManuallyEdited]);

  // Calculate regular price when final price or discount changes
  useEffect(() => {
    if (formData.finalPrice) {
      const finalPrice = Number(formData.finalPrice);
      
      if (formData.discountPercent && Number(formData.discountPercent) > 0) {
        const discount = Number(formData.discountPercent);
        // Calculate what the regular price would need to be to achieve this final price after discount
        const calculatedRegularPrice = finalPrice / (1 - discount / 100);
        
        setFormData(prev => ({
          ...prev,
          regularPrice: calculatedRegularPrice.toFixed(2)
        }));
      } else {
        // If no discount, regular price equals final price
        setFormData(prev => ({
          ...prev,
          regularPrice: formData.finalPrice
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        regularPrice: ''
      }));
    }
  }, [formData.finalPrice, formData.discountPercent]);

  // Fetch categories from the database
  const fetchCategories = async () => {
    try {
      setFetchingCategories(true);
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategoryStructure(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setFetchingCategories(false);
    }
  };

  useEffect(() => {
    // Fetch categories when the drawer opens
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Create local preview URLs
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrls(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      // If title is empty, generate product URL from first image filename
      if (!formData.title && newFiles.length > 0) {
        // Get the file name without extension
        const fileName = newFiles[0].name.split('.')[0];
        // Format it for URL
        const formattedName = fileName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Update the form data with generated title and URL
        setFormData(prev => ({
          ...prev,
          title: fileName.replace(/[-_]/g, ' ')
        }));
        
        setFormData(prev => ({
          ...prev,
          link: `www.rnstudentresources.com/products/${formattedName}`
        }));
      }
    }
  };

  // Function to remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Function to upload files to S3
  const uploadToS3 = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of selectedFiles) {
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        
        // Create a presigned URL for upload
        const response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename,
            contentType: file.type,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get upload URL');
        }
        
        const { url, fileUrl } = await response.json();
        
        // Upload the file to the presigned URL
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        uploadedUrls.push(fileUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.finalPrice) {
      toast.error("Product title and price are required");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Generate a slug based on the title
      const baseSlug = slugify(formData.title);
      
      // We'll let the backend append the ID to the slug
      // The final URL will be like: title-id
      const productSlug = baseSlug;
      
      // Upload images to S3 and get URLs
      const uploadedImageUrls = await uploadToS3();
      
      // Format the image data for the database
      const imageData = uploadedImageUrls.map((url, index) => ({
        url,
        alt: formData.title ? `${formData.title} image ${index + 1}` : `Product image ${index + 1}`,
        isPrimary: index === 0
      }));
      
      // Prepare the product data
      const productData = {
        title: formData.title,
        description: formData.description || "",
        path: productSlug,
        slug: productSlug,
        price: parseFloat(formData.regularPrice || formData.finalPrice || "0"),
        finalPrice: parseFloat(formData.finalPrice || "0"),
        inStock,
        featured: isFeatured,
        images: imageData,
        // Use the selectedCategoryPaths directly, which now preserves the selection order
        categories: selectedCategoryPaths,
        discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : null,
        discountType: formData.discountType || "percent",
        accessDuration: formData.accessDuration ? parseInt(formData.accessDuration) : (isUnlimitedAccess ? -1 : null),
        downloadLimit: formData.downloadLimit ? parseInt(formData.downloadLimit) : (isUnlimitedDownloads ? -1 : null),
        downloadUrl: formData.downloadLink || null,
        isPublished: true
      };
      
      console.log("Sending product data to API:", productData);
      
      // Call the API endpoint
      const response = await fetch("/api/products-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", response.status, errorText);
        throw new Error(`Failed to create product: ${response.status}`);
      }
      
      toast.success("Product created successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get readable name from path - moved inside component
  const getPathReadableName = (path: string): string => {
    const parts = path.split('/');
    
    const findCategory = (items: CategoryItem[], id: string): CategoryItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findCategory(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const lastPartId = parts[parts.length - 1];
    const category = findCategory(categoryStructure, lastPartId);
    
    return category ? category.name : path;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-[80%] w-[95vw] lg:max-w-[85%] overflow-y-auto border-l-0 pb-24 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
          {/* Custom curved header with accent shape */}
          <div className="relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full -mr-32 -mt-32 z-0"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full -ml-16 -mt-16 z-0"></div>
            
            <SheetHeader className="relative z-10 pb-8 pt-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <SheetTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700">
                      Create Magic
                    </SheetTitle>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 ml-10 italic">Design your next bestselling product</p>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-white/50 rounded-full h-10 w-10 transition-all duration-300 hover:rotate-90">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>
          </div>
          
          {/* Custom wavy divider */}
          <div className="relative h-12 -mt-4 mb-6">
            <svg className="absolute w-full h-12" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ffffff" d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
          </div>

          <div className="px-6 space-y-10 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Info - with unique styling */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 transform hover:translate-y-[-2px] transition-all duration-300">
                  <div className="flex items-center mb-5">
                    <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-4"></div>
                    <h3 className="text-xl font-bold text-gray-800">Basic Information</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 block mb-2 flex items-center">
                        <span className="bg-blue-100 p-1 rounded-md mr-2">
                          <Package className="h-4 w-4 text-blue-700" />
                        </span>
                        Product Name
                      </Label>
                      <Input 
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        placeholder="e.g., NCLEX-RN Complete Study Guide" 
                        className="rounded-xl bg-gradient-to-r from-white to-gray-50 border-indigo-100 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                      />
                    </div>
                    
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 block mb-2 flex items-center">
                        <span className="bg-blue-100 p-1 rounded-md mr-2">
                          <LinkIcon className="h-4 w-4 text-blue-700" />
                        </span>
                        Product URL
                      </Label>
                      <div className="relative mt-2">
                        <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                        <Input 
                          name="link"
                          value={formData.link}
                          onChange={handleFormChange}
                          className="pl-10 bg-gradient-to-r from-white to-gray-50 border-indigo-100 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        URL is automatically generated from the product name but can be manually edited
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 block mb-2 flex items-center">
                        <span className="bg-blue-100 p-1 rounded-md mr-2">
                          <ImageIcon className="h-4 w-4 text-blue-700" />
                        </span>
                        Description
                      </Label>
                      <div className="mt-2 border rounded-lg overflow-hidden">
                        <Textarea 
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          placeholder="Describe your product..."
                          className="min-h-[150px] border-0 focus-visible:ring-0 resize-none bg-gradient-to-r from-white to-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Section - custom design */}
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-indigo-100">
                  <div className="flex items-center mb-5">
                    <div className="h-10 w-1 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-4"></div>
                    <h3 className="text-xl font-bold text-gray-800">Product Gallery</h3>
                  </div>
                  
                  <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 bg-white hover:bg-blue-50 transition-colors relative overflow-hidden">
                    {/* Create decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 opacity-30 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 opacity-30 rounded-full -ml-16 -mb-16"></div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/jpg"
                      multiple
                      onChange={handleFileSelect}
                    />
                    
                    {selectedFiles.length === 0 ? (
                      <div 
                        className="flex items-center justify-center h-40 cursor-pointer relative z-10"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="text-center">
                          <div className="mb-4 bg-indigo-50 p-4 rounded-full inline-block">
                            <Upload className="w-8 h-8 text-indigo-600" />
                          </div>
                          <p className="text-base text-gray-600 font-medium">
                            Drop files here or{" "}
                            <span className="text-blue-600 underline">browse</span>
                          </p>
                          <p className="text-sm text-gray-400 mt-2">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 relative z-10">
                        <div className="grid grid-cols-3 gap-4">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative group rounded-xl overflow-hidden shadow-md transform transition-transform hover:scale-105">
                              <img 
                                src={url} 
                                alt={`Preview ${index}`} 
                                className="h-32 w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <button
                                type="button"
                                className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                          <div
                            className="h-32 flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 cursor-pointer bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors transform hover:scale-105"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="h-6 w-6 text-indigo-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Link */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-4">
                    <Download className="h-5 w-5 text-[#1e2c51]" />
                    Download Link
                  </h3>
                  <Input 
                    name="downloadLink"
                    value={formData.downloadLink}
                    onChange={handleFormChange}
                    className="mt-2" 
                    placeholder="https://..."
                  />
                </div>

                {/* Access Settings */}
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Timer className="h-5 w-5 text-[#1e2c51]" />
                    Access Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Access Duration (days)</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="unlimitedAccess"
                            checked={isUnlimitedAccess}
                            onCheckedChange={(checked) => setIsUnlimitedAccess(checked as boolean)}
                          />
                          <label htmlFor="unlimitedAccess" className="text-sm">Unlimited</label>
                        </div>
                      </div>
                      <div className="relative mt-2">
                        <Timer className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                        <Input 
                          name="accessDuration"
                          value={formData.accessDuration}
                          onChange={handleFormChange}
                          type="number"
                          disabled={isUnlimitedAccess}
                          className="pl-10" 
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Download Limit</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="unlimitedDownloads"
                            checked={isUnlimitedDownloads}
                            onCheckedChange={(checked) => setIsUnlimitedDownloads(checked as boolean)}
                          />
                          <label htmlFor="unlimitedDownloads" className="text-sm">Unlimited</label>
                        </div>
                      </div>
                      <div className="relative mt-2">
                        <Download className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                        <Input 
                          name="downloadLimit"
                          value={formData.downloadLimit}
                          onChange={handleFormChange}
                          type="number"
                          disabled={isUnlimitedDownloads}
                          className="pl-10" 
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Floating Card Design */}
              <div className="space-y-6 relative">
                <div className="space-y-6">
                  {/* Categories - Styled Modern Card */}
                  <div className="bg-white rounded-xl px-6 py-5 border border-indigo-100 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-4 border-b border-indigo-100">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full p-2 bg-gradient-to-br from-indigo-500 to-blue-600">
                            <Tag className="h-5 w-5 text-white" />
                          </span>
                          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">Categories</h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 px-3"
                              onClick={() => handleAddCategory('', 'university')}
                            >
                              <Plus className="h-4 w-4 mr-1" /> University
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-200 text-amber-700 hover:bg-amber-50 px-3"
                              onClick={() => handleAddCategory('', 'product-type')}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Product Type
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Section labels */}
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <div className="bg-blue-50 rounded-md p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-medium text-blue-700">Universities</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Academic institutions</p>
                          </div>
                          <div className="bg-amber-50 rounded-md p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                              <span className="text-sm font-medium text-amber-700">Product Types</span>
                            </div>
                            <p className="text-xs text-amber-600 mt-1">Content categories</p>
                          </div>
                        </div>
                        
                        <div className="rounded-xl overflow-hidden">
                          <div className="flex border-b border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 p-2.5 text-xs font-medium">
                            <div className="w-5"></div>
                            <div className="flex-1 flex gap-1.5">
                              <span className="px-3">Category</span>
                              <div className="flex space-x-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-sm">University</span>
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm">Product</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border border-indigo-100 rounded-b-xl max-h-[320px] overflow-y-auto bg-white">
                          {fetchingCategories ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                              <div className="w-8 h-8 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                              <span className="text-sm text-gray-600">Loading categories...</span>
                            </div>
                          ) : categoryStructure.length === 0 ? (
                            <div className="flex flex-col items-center text-center py-10 px-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Tag className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500 mb-4">No categories found</p>
                              <div className="flex flex-col gap-2 w-full max-w-xs">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 justify-center"
                                  onClick={() => handleAddCategory('', 'university')}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Add University
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 justify-center"
                                  onClick={() => handleAddCategory('university', 'university-name')}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Add School
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 justify-center"
                                  onClick={() => handleAddCategory('', 'product-type')}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Add Product Type
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2">
                              <CategoryTree items={categoryStructure} />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Category tip */}
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p className="flex items-center">                        
                          <span className="mr-1">💡</span> 
                          <span>Tip: Categories help organize your products and make them easier to find for customers.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing - Creative Card */}
                  <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-indigo-100 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-100 to-indigo-50 opacity-40 rounded-full -ml-32 -mb-32 z-0"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <span className="bg-blue-100 p-2 rounded-lg mr-3">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">Pricing</h3>
                      </div>
                      
                      {/* Custom pricing inputs */}
                      <div className="space-y-5">
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                          <Label className="text-sm font-medium text-gray-700 block mb-2">Final Price ($)</Label>
                          <div className="relative">
                            <div className="absolute left-3 top-3 h-5 w-5 text-blue-500">$</div>
                            <Input 
                              name="finalPrice"
                              value={formData.finalPrice}
                              onChange={handleFormChange}
                              type="number" 
                              className="pl-8 rounded-lg border-blue-200 focus:border-blue-400" 
                              placeholder="79.99"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Discount</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="relative">
                              <Percent className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                              <Input 
                                name="discountPercent"
                                value={formData.discountPercent}
                                onChange={handleFormChange}
                                type="number"
                                className="pl-10"
                                placeholder="20"
                              />
                            </div>
                            <Select
                              defaultValue="percent"
                              onValueChange={(value) => 
                                handleFormChange({ target: { name: 'discountType', value } } as any)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percent">Percent (%)</SelectItem>
                                <SelectItem value="amount">Amount ($)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {formData.regularPrice && Number(formData.regularPrice) > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <Label className="text-sm text-gray-600">Regular Price</Label>
                            <p className="text-lg font-bold text-gray-700">
                              ${Number(formData.regularPrice).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Price before discount (the crossed-out price shown to customers)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom floating action bar */}
          <div className="fixed bottom-8 right-8 left-8 z-20">
            <div className="flex items-center justify-end gap-4 max-w-[calc(85%-4rem)] ml-auto">
              <div className="bg-white/95 backdrop-blur-lg py-3 px-6 rounded-2xl shadow-2xl border border-indigo-100 flex items-center gap-4">
                <SheetClose asChild>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button 
                  size="lg"
                  className="px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Create Product</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
                  </div>
        </SheetContent>
        
        {/* Add Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {currentParentPath 
                  ? `Add Subcategory to ${getPathReadableName(currentParentPath)}` 
                  : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-2"
                  placeholder={currentParentPath === 'university' 
                    ? "e.g., Chamberlain University" 
                    : currentParentPath.startsWith('university/') && currentParentPath.split('/').length === 2 
                      ? "e.g., NR 322, NURS 6501" 
                      : "e.g., New Category"}
                  autoFocus
                />
              </div>
              
              {!currentParentPath ? (
                <div>
                  <Label htmlFor="categoryType">Category Type</Label>
                  <Select 
                    value={categoryType} 
                    onValueChange={setCategoryType}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="product-type">Product Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Category Type</Label>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    {currentParentPath === 'university'
                      ? 'University Name (e.g., Chamberlain, Walden)'
                      : currentParentPath.startsWith('university/') && currentParentPath.split('/').length === 2
                        ? 'Course Level (e.g., NR 322, NURS 6501)'
                        : currentParentPath.startsWith('product-type')
                          ? 'Product Type'
                          : 'Subcategory'}
                  </div>
                  
                  {/* Add helper text for course levels */}
                  {currentParentPath.startsWith('university/') && currentParentPath.split('/').length === 2 && (
                    <div className="mt-1 text-xs text-indigo-600">
                      Format as "NR 322" or "NURS 6501" (course code with space)
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // If we're adding a root category, use the selected type
                  // If we're adding a subcategory, the type is inferred from the parent
                  addCategory(currentParentPath, newCategoryName, categoryType);
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                disabled={!newCategoryName.trim() || (!currentParentPath && !categoryType)}
              >
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Sheet>
    </>
  );
} 