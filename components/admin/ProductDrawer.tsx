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

  // Replace static structure with state to allow dynamic modification
  const [categoryStructure, setCategoryStructure] = useState<CategoryItem[]>([
    {
      id: "university",
      name: "University",
      children: [
        {
          id: "chamberlain",
          name: "Chamberlain University",
          children: [
            { id: "nr322", name: "NR 322" },
            { id: "nr351", name: "NR 351" },
            { id: "nr439", name: "NR 439" }
          ]
        },
        {
          id: "walden",
          name: "Walden University",
          children: [
            { id: "nurs6501", name: "NURS 6501" },
            { id: "nurs6512", name: "NURS 6512" }
          ]
        }
      ]
    },
    {
      id: "product-type",
      name: "Product Type",
      children: [
        { id: "testbank", name: "Test Bank" },
        { id: "solution-manual", name: "Solution Manual" },
        { id: "past-exams", name: "Past Exams" },
        { id: "exam-screenshots", name: "Exam Screenshots" }
      ]
    }
  ]);

  // New state for category creation
  const [newCategoryName, setNewCategoryName] = useState("");
  const [currentParentPath, setCurrentParentPath] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Replace the flat selectedCategories with hierarchical path structure
  // Store as array of path strings like ["university/chamberlain/nr322"]
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState<string[]>([]);

  // Function to check if a category path is selected
  const isCategoryPathSelected = (path: string) => {
    return selectedCategoryPaths.includes(path);
  };

  // Function to handle category selection
  const handleCategoryPathChange = (path: string, checked: boolean) => {
    if (checked) {
      setSelectedCategoryPaths(prev => [...prev, path]);
    } else {
      setSelectedCategoryPaths(prev => prev.filter(p => p !== path));
    }
  };

  // Function to add a new category at any level
  const addCategory = (parentPath: string, categoryName: string) => {
    if (!categoryName.trim()) return;
    
    // Generate an ID from the name
    const categoryId = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Create new category object
    const newCategory: CategoryItem = {
      id: categoryId,
      name: categoryName.trim()
    };
    
    // If adding at root level
    if (!parentPath) {
      setCategoryStructure(prev => [...prev, newCategory]);
      return;
    }
    
    // If adding as a child of another category
    const pathParts = parentPath.split('/');
    
    // Helper function to recursively update the category structure
    const updateCategoryStructure = (items: CategoryItem[], parts: string[], depth: number): CategoryItem[] => {
      return items.map(item => {
        if (item.id === parts[depth]) {
          if (depth === parts.length - 1) {
            // We found the parent item, add the new category to its children
            return {
              ...item,
              children: [...(item.children || []), newCategory]
            };
          } else if (item.children) {
            // Continue recursion
            return {
              ...item,
              children: updateCategoryStructure(item.children, parts, depth + 1)
            };
          }
        }
        return item;
      });
    };
    
    setCategoryStructure(prev => updateCategoryStructure(prev, pathParts, 0));
  };
  
  // Function to remove a category at any level
  const removeCategory = (path: string) => {
    const pathParts = path.split('/');
    
    // If removing a root level category
    if (pathParts.length === 1) {
      setCategoryStructure(prev => prev.filter(item => item.id !== pathParts[0]));
      return;
    }
    
    // Find the parent category path
    const parentPath = pathParts.slice(0, -1).join('/');
    const categoryId = pathParts[pathParts.length - 1];
    
    // Helper function to recursively update the category structure
    const updateCategoryStructure = (items: CategoryItem[], parts: string[], depth: number): CategoryItem[] => {
      if (depth === parts.length - 2) {
        // We found the parent of the category to remove
        return items.map(item => {
          if (item.id === parts[depth] && item.children) {
            return {
              ...item,
              children: item.children.filter(child => child.id !== parts[depth + 1])
            };
          }
          return item;
        });
      }
      
      return items.map(item => {
        if (item.id === parts[depth] && item.children) {
          return {
            ...item,
            children: updateCategoryStructure(item.children, parts, depth + 1)
          };
        }
        return item;
      });
    };
    
    setCategoryStructure(prev => updateCategoryStructure(prev, pathParts, 0));
    
    // Also remove this category and its children from selected paths
    setSelectedCategoryPaths(prev => 
      prev.filter(selectedPath => !selectedPath.startsWith(path))
    );
  };

  // Move this function outside of CategoryTree and into the main component
  const handleAddCategory = (path: string) => {
    setCurrentParentPath(path);
    setNewCategoryName("");
    setIsAddingCategory(true);
  };

  // New component for rendering category tree
  const CategoryTree = ({ 
    items, 
    parentPath = "" 
  }: { 
    items: CategoryItem[], 
    parentPath?: string 
  }) => {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
      // Auto-expand first level
      items.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
    );

    const toggleExpand = (itemId: string) => {
      setExpandedItems(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
    };
    
    return (
      <div className="space-y-2">
        {items.map(item => {
          const currentPath = parentPath ? `${parentPath}/${item.id}` : item.id;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems[item.id];

          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center group">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="mr-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-5" />
                )}
                <div className="flex items-center space-x-2 flex-1">
                  <Checkbox 
                    id={currentPath}
                    checked={isCategoryPathSelected(currentPath)}
                    onCheckedChange={(checked) => 
                      handleCategoryPathChange(currentPath, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={currentPath}
                    className="text-sm font-medium leading-none flex-1"
                  >
                    {item.name}
                  </label>
                  <div className="hidden group-hover:flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleAddCategory(currentPath)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                      title="Add subcategory"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(currentPath)}
                      className="text-gray-500 hover:text-red-500 p-1 rounded hover:bg-gray-100"
                      title="Remove category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {hasChildren && isExpanded && (
                <div className="pl-6 border-l border-gray-200 ml-2">
                  <CategoryTree items={item.children || []} parentPath={currentPath} />
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

  const categories = [
    "Events",
    "Study Resources",
    "Testbanks",
    "Solution Manuals",
    "Past Exams",
    "Exam Screenshots"
  ];

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories(prev => 
      checked 
        ? [...prev, category]
        : prev.filter(c => c !== category)
    );
  };

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
              <div className="space-y-8 relative">
                <div className="sticky top-20 space-y-6">
                  {/* Categories - Unique Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-50 opacity-50 rounded-full -mr-32 -mt-32 z-0"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <span className="bg-indigo-100 p-2 rounded-lg mr-3">
                            <Tag className="h-5 w-5 text-indigo-600" />
                          </span>
                          <h3 className="text-xl font-bold text-gray-800">Categories</h3>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg"
                          onClick={() => handleAddCategory("")}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Category
                        </Button>
                      </div>
                      <div className="border border-indigo-100 rounded-xl p-4 max-h-[350px] overflow-y-auto bg-gradient-to-br from-white to-indigo-50/30">
                        <CategoryTree items={categoryStructure} />
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
            <div className="py-4">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="mt-2"
                placeholder="e.g., New University"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingCategory(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  addCategory(currentParentPath, newCategoryName);
                  setIsAddingCategory(false);
                }}
                disabled={!newCategoryName.trim()}
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