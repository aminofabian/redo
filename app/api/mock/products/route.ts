import { NextRequest, NextResponse } from 'next/server';

// Mock product list data
const mockProducts = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    status: "Published",
    price: "$49.99",
    lastUpdated: "2d ago",
    sales: 128
  },
  {
    id: "2",
    title: "React Mastery",
    status: "Published",
    price: "$79.99",
    lastUpdated: "5d ago",
    sales: 85
  },
  {
    id: "3",
    title: "Node.js Backend Development",
    status: "Draft",
    price: "$64.99",
    lastUpdated: "1w ago",
    sales: 0
  },
  {
    id: "4",
    title: "CSS Layouts and Flexbox",
    status: "Published",
    price: "$39.99",
    lastUpdated: "3d ago",
    sales: 56
  },
  {
    id: "5",
    title: "TypeScript for React Developers",
    status: "Draft",
    price: "$59.99",
    lastUpdated: "4d ago",
    sales: 0
  }
];

export async function GET(request: NextRequest) {
  try {
    // Get search parameter
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    
    // Filter products based on search term
    const filteredProducts = search 
      ? mockProducts.filter(p => 
          p.title.toLowerCase().includes(search.toLowerCase())
        )
      : mockProducts;
    
    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching mock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 