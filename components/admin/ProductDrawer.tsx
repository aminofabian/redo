"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Package, DollarSign, Image as ImageIcon, Upload, 
  X, Link as LinkIcon, Percent, Calendar, Clock, Tag, 
  Download, Eye, Timer, Users, Infinity
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

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onPreviewOpen?: () => void;
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
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  
  // Add this internal formData state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPercent: '',
    discountType: 'percent',
    accessDuration: '',
    downloadLimit: '',
    downloadLink: '',
    link: ''
  });

  // Handle form changes locally
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-generate URL from title
  useEffect(() => {
    if (formData.title) {
      const url = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({
        ...prev,
        link: `www.instudentresources.com/products/${url}`
      }));
    }
  }, [formData.title]);

  // Calculate final price when price or discount changes
  useEffect(() => {
    if (formData.price) {
      const basePrice = Number(formData.price);
      if (formData.discountPercent && Number(formData.discountPercent) > 0) {
        const discount = Number(formData.discountPercent);
        setFinalPrice(basePrice * (1 - discount / 100));
      } else {
        setFinalPrice(basePrice);
      }
    } else {
      setFinalPrice(null);
    }
  }, [formData.price, formData.discountPercent]);

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
          link: `www.instudentresources.com/products/${formattedName}`
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
    
    console.log("Submit clicked", { formData });
    
    // Comprehensive validation
    const validationErrors = [];
    
    if (!formData.title || formData.title.trim() === '') {
      validationErrors.push("Product title is required");
    }
    
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      validationErrors.push("Please enter a valid price");
    }
    
    // Display all validation errors
    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors);
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Upload images to S3 and get URLs
      const uploadedImageUrls = await uploadToS3();
      
      // Format the image data for the database
      const imageData = uploadedImageUrls.map((url, index) => ({
        url,
        alt: formData.title ? `${formData.title} image ${index + 1}` : `Product image ${index + 1}`,
        isPrimary: index === 0 // First image is primary
      }));
      
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          categories: selectedCategories,
          isUnlimitedAccess,
          isUnlimitedDownloads,
          inStock,
          images: imageData, // Structured image data for database
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      toast.success("Product created successfully");
      router.refresh(); // Refresh the page to show new product
      onClose(); // Close the drawer
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[75vw] overflow-y-auto border-l border-gray-200">
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
                      className="pl-10 bg-gray-50 text-gray-700 font-medium"
                      readOnly 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">URL is automatically generated from the product name</p>
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
              {/* Categories */}
              <div>
                <h3 className="text-base font-medium mb-4">Categories</h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Regular Price ($)</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input 
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      type="number" 
                      className="pl-10" 
                      placeholder="99.99"
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

                {finalPrice !== null && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm text-gray-600">Final Price</Label>
                    <p className="text-lg font-bold text-green-600">
                      ${finalPrice.toFixed(2)}
                      {Number(formData.discountPercent) > 0 && (
                        <span className="ml-2 text-sm line-through text-gray-400">
                          ${Number(formData.price).toFixed(2)}
                        </span>
                      )}
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
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 right-0 left-0 p-6 bg-white border-t">
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
    </Sheet>
  );
} 