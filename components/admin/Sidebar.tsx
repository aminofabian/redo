import { useState } from "react";

// Define a type for the product items
type Product = {
  id: string | number;
  title: string;
  discountAmount?: number;
  discountPercent?: number;
  price?: number;
  // Add other properties as needed
};

export function Sidebar({ products = [] as Product[] }) {
  // Add the missing state
  const [showDiscounted, setShowDiscounted] = useState(false);
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Price Range</h3>
      {products.some(p => p.discountAmount || p.discountPercent) && (
        <div className="flex items-center mb-2">
          <input 
            type="checkbox" 
            id="show-discounted" 
            className="mr-2"
            checked={showDiscounted}
            onChange={() => setShowDiscounted(!showDiscounted)}
          />
          <label htmlFor="show-discounted" className="text-sm">
            Show discounted items
          </label>
        </div>
      )}
      
      {/* Rest of your price filter code */}
    </div>
  );
} 