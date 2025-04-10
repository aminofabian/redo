"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Check, X, RefreshCw, Save } from "lucide-react";
import { generateProductSlug } from "@/lib/products";
import { useRouter } from "next/navigation";

type EditSlugButtonProps = {
  product: {
    id: string | number;
    slug: string;
  };
};

export default function EditSlugButton({ product }: EditSlugButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [slugValue, setSlugValue] = useState(product.slug);
  const router = useRouter();

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      const response = await fetch(`/api/products/${String(product.id)}/update-slug`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: slugValue }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update slug: ${response.statusText}`);
      }

      setIsEditing(false);
      router.push(`/products/${slugValue}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  const regenerateSlug = () => {
    const newSlug = generateProductSlug(product);
    setSlugValue(newSlug);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={slugValue}
          onChange={(e) => setSlugValue(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleSaveClick}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleEditClick}>
      <Edit className="h-4 w-4 mr-2" />
      Edit URL
    </Button>
  );
} 