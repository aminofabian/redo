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
        <SheetContent className="w-[75vw] overflow-y-auto border-l border-gray-200 pb-24">
          <SheetHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-2xl">Add New Products</SheetTitle>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <div className="mt-6 space-y-8 pb-24">
            <div className="grid grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="col-span-2 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Name</Label>
                    <Input 
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="e.g., NCLEX-RN Complete Study Guide" 
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Product URL</Label>
                    <div className="relative mt-2">
                      <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input 
                        name="link"
                        value={formData.link}
                        onChange={handleFormChange}
                        className="pl-10 bg-white text-gray-700 font-medium"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      URL is automatically generated from the product name but can be manually edited
                    </p>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Description</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <Textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Describe your product..."
                        className="min-h-[150px] border-0 focus-visible:ring-0 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <Label className="text-base font-medium">Images</Label>
                  <div className="mt-2 border border-dashed rounded-lg p-4">
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
                        className="flex items-center justify-center h-32 bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Drop your files here, or{" "}
                            <span className="text-blue-500 hover:underline">browse</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={url} 
                                alt={`Preview ${index}`} 
                                className="h-24 w-full object-cover rounded-md"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <div
                            className="h-24 flex items-center justify-center border border-dashed rounded-md cursor-pointer hover:bg-gray-50"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Link */}
                <div>
                  <Label className="text-base font-medium">Download Link</Label>
                  <Input 
                    name="downloadLink"
                    value={formData.downloadLink}
                    onChange={handleFormChange}
                    className="mt-2" 
                    placeholder="https://..."
                  />
                </div>

                {/* Access Settings */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Access Settings</h3>
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

              {/* Right Column */}
              <div className="space-y-8">
                {/* Categories - Replace with Hierarchical Categories */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium">Categories</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleAddCategory("")}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Category
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <CategoryTree items={categoryStructure} />
                  </div>
                  {selectedCategoryPaths.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Selected categories:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedCategoryPaths.map(path => {
                          const parts = path.split('/');
                          const readableParts = parts.map((part, index) => {
                            let currentPath = parts.slice(0, index + 1).join('/');
                            return getPathReadableName(currentPath);
                          });
                          const readablePath = readableParts.join(' > ');
                          
                          return (
                            <div key={path} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-xs">
                              {readablePath}
                              <button 
                                onClick={() => handleCategoryPathChange(path, false)}
                                className="ml-2 text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Final Price ($)</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input 
                        name="finalPrice"
                        value={formData.finalPrice}
                        onChange={handleFormChange}
                        type="number" 
                        className="pl-10" 
                        placeholder="79.99"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Discount</Label>
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

                {/* Stock Status */}
                <div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inStock" 
                      checked={inStock}
                      onCheckedChange={(checked) => setInStock(checked as boolean)}
                    />
                    <label
                      htmlFor="inStock"
                      className="text-sm font-medium leading-none"
                    >
                      In Stock
                    </label>
                  </div>
                </div>

                {/* Featured Product */}
                <div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="featured" 
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                    />
                    <label
                      htmlFor="featured"
                      className="text-sm font-medium leading-none"
                    >
                      Featured Product
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Featured products appear in highlighted sections
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Move the actions inside SheetContent instead of after it */}
          <div className="fixed bottom-0 right-0 w-[75vw] p-6 bg-white border-t">
            <div className="flex items-center justify-end gap-3 max-w-[75vw] mx-auto">
              <SheetClose asChild>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button 
                size="lg"
                className="bg-[#1e2c51] text-white hover:bg-[#1e2c51]/90 px-8"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
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