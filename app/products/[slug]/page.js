// Server Component
export default function ProductPage({ params }) {
  return (
    <ClientProductPage slug={params.slug} />
  );
}

// Client Component
'use client';

import { useState, useEffect } from 'react';

function ClientProductPage({ slug }) {
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
      {/* Your product display code */}
    </div>
  );
} 