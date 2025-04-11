import { NextRequest, NextResponse } from 'next/server';

// Mock product data
const mockProducts = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    description: "A comprehensive guide to JavaScript basics for beginners.",
    status: "Published",
    price: "$49.99",
    lastUpdated: "2d ago",
    sales: 128,
    slug: "javascript-fundamentals",
    images: [
      {
        id: "img1",
        url: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        isPrimary: true
      }
    ],
    categories: ["Programming", "Web Development"],
    viewCount: 1240,
    conversionRate: "10.3%",
    lastPurchase: "2h ago",
    createdBy: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      image: null
    },
    downloadUrl: "/files/javascript-fundamentals.pdf",
    accessDuration: 365,
    downloadLimit: 10
  },
  {
    id: "2",
    title: "React Mastery",
    description: "Advanced techniques for building React applications.",
    status: "Published",
    price: "$79.99",
    lastUpdated: "5d ago",
    sales: 85,
    slug: "react-mastery",
    images: [
      {
        id: "img2",
        url: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        isPrimary: true
      }
    ],
    categories: ["Programming", "React", "Frontend"],
    viewCount: 950,
    conversionRate: "8.9%",
    lastPurchase: "1d ago",
    createdBy: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      image: null
    },
    downloadUrl: "/files/react-mastery.pdf",
    accessDuration: 365,
    downloadLimit: 10
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching mock product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
} 