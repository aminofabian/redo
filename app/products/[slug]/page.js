'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Completely client-side component
export default function ProductPage() {
  const params = useParams();
  const slug = params.slug;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Now it's safe to use localStorage
    const savedData = localStorage.getItem('whatever');
    
    // Fetch product data
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);
  
  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;
  
  return (
    <div>
      <h1>{product.title}</h1>
      {/* Rest of your product display code */}
    </div>
  );
} 