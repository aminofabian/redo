// Server Component to fetch data
import FeaturedResources from '@/components/FeaturedResources';
import NursingResourcesSection from './ui/NursingResources';

export default async function FeaturedResourcesWrapper() {
  try {
    // Use absolute URL to avoid relative path issues
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products/featured`, { 
      cache: 'force-cache',  // Use force-cache to prevent request flooding
      next: { revalidate: 3600 } // Revalidate once per hour
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching featured products: ${response.status}`);
    }
    
    const products = await response.json();
    
    // Return the NursingResourcesSection directly with the products
    return <NursingResourcesSection products={products} />;
  } catch (err) {
    console.error('Failed to fetch featured products:', err);
    
    // Return fallback data if fetch fails
    const fallbackProducts = [
      {
        id: "fallback1",
        slug: "fallback-resource",
        title: "Nursing Resources (Fallback)",
        originalPrice: 199.99,
        price: 99.99,
        discountPercent: 50,
        image: "/placeholder-image.jpg",
        questions: "2000+ Questions",
        students: "250+ Students",
        rating: "4.5",
        reviews: 42,
        lastUpdated: "Updated recently",
        duration: "Lifetime Access",
        tags: ["Nursing", "Study Material"]
      }
    ];
    
    return <NursingResourcesSection products={fallbackProducts} />;
  }
} 