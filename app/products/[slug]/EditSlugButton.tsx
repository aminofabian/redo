"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Check, X, RefreshCw } from "lucide-react";
import { generateProductSlug } from "@/lib/products";
import { useRouter } from "next/navigation";

interface EditSlugButtonProps {
  product: any;
  className?: string;
}

export default function EditSlugButton({ product, className = "" }: EditSlugButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [slugValue, setSlugValue] = useState(product.slug);
  const router = useRouter();

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/products/${String(product.id)}/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: slugValue }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update slug");
      }
      
      alert("URL updated successfully");
      router.push(`/products/${slugValue}`);
    } catch (error) {
      alert(`Error: ${error.message || "An error occurred"}`);
    }
  };

  const regenerateSlug = () => {
    const newSlug = generateProductSlug(product);
    setSlugValue(newSlug);
  };

  if (!isEditing) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className={`text-gray-500 hover:text-gray-700 ${className}`}
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-4 w-4 mr-1" />
        Edit URL
      </Button>
    );
  }

  return (
    <div className="space-y-2 p-3 border rounded-md bg-gray-50">
      <div className="flex items-center">
        <span className="text-gray-500 mr-1 text-sm">/products/</span>
        <Input
          value={slugValue}
          onChange={(e) => setSlugValue(e.target.value)}
          className="flex-1 h-8 text-sm"
          placeholder="product-name-123"
        />
      </div>
      
      <div className="text-xs text-gray-500">
        Use lowercase letters, numbers, and hyphens only.
      </div>
      
      <div className="flex space-x-2">
        <Button size="sm" onClick={handleSave} className="h-8">
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={regenerateSlug} className="h-8">
          <RefreshCw className="h-4 w-4 mr-1" />
          Auto-Generate
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="h-8">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
} 