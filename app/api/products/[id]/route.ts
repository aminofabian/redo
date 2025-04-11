import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

type Image = {
  id: string;
  url: string;
  isPrimary: boolean;
}

type Purchase = {
  id: string;
  userId: string;
  amount: number;
  createdAt: Date;
}

type ProductWithRelations = {
  id: number;
  title: string;
  description: string | null;
  slug: string | null;
  price: number;
  finalPrice: number;
  purchaseCount: number;
  viewCount: number;
  isPublished: boolean;
  updatedAt: Date;
  downloadUrl: string | null;
  accessDuration: number | null;
  downloadLimit: number | null;
  images: Image[];
  categories: { category: { name: string } }[];
  purchases: Purchase[];
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Convert the ID to a number since our schema uses Int for product IDs
    const productId = parseInt(params.id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Fetch the product with all its related data
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
        purchases: true, // Use purchases instead of orders
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Transform the data to match the expected format
    const formattedProduct = {
      id: product.id.toString(),
      title: product.title,
      description: product.description || "",
      status: product.isPublished ? "Published" : "Draft",
      price: `$${Number(product.price).toFixed(2)}`,
      lastUpdated: formatDate(product.updatedAt),
      sales: product.purchaseCount || 0,
      slug: product.slug,
      images: product.images.map((img: Image) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary
      })),
      categories: product.categories.map((pc: { category: { name: string } }) => pc.category.name),
      orders: product.purchases.map((purchase: Purchase) => ({
        order: {
          id: purchase.id,
          userId: purchase.userId,
          totalAmount: purchase.amount,
          createdAt: purchase.createdAt
        }
      })),
      downloadUrl: product.downloadUrl || null,
      accessDuration: product.accessDuration,
      downloadLimit: product.downloadLimit,
      createdBy: {
        firstName: product.createdBy?.name?.split(' ')[0] || '',
        lastName: product.createdBy?.name?.split(' ').slice(1).join(' ') || '',
        email: product.createdBy?.email || '',
        image: product.createdBy?.image || null
      },
      viewCount: product.viewCount || 0,
      conversionRate: product.purchaseCount > 0 
        ? `${((product.purchaseCount / Math.max(1, product.viewCount)) * 100).toFixed(1)}%` 
        : "0%",
      lastPurchase: product.purchases.length > 0 
        ? formatDate(product.purchases.sort((a: Purchase, b: Purchase) => 
            b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt) 
        : "Never"
    };
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatPrice(price: any): string {
  return `$${Number(price).toFixed(2)}`;
} 