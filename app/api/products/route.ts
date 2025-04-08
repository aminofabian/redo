import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Add null checks for required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Product title is required' },
        { status: 400 }
      );
    }
    
    // Extract image data and other fields
    const { 
      images, 
      categories,
      // Remove fields that don't match the schema
      link, // This is UI-only and not needed in DB
      ...rawProductData 
    } = data;
    
    // Ensure only valid fields are passed to Prisma
    const productData = {
      title: rawProductData.title,
      description: rawProductData.description,
      price: parseFloat(rawProductData.price || '0'),
      discountPercent: rawProductData.discountPercent ? parseInt(rawProductData.discountPercent) : null,
      discountType: rawProductData.discountType,
      accessDuration: rawProductData.isUnlimitedAccess ? null : 
        (rawProductData.accessDuration ? parseInt(rawProductData.accessDuration) : null),
      downloadLimit: rawProductData.isUnlimitedDownloads ? null : 
        (rawProductData.downloadLimit ? parseInt(rawProductData.downloadLimit) : null),
      inStock: rawProductData.inStock,
      isPublished: true,
      downloadUrl: rawProductData.downloadLink
    };
    
    // Calculate the final price based on discount if applicable
    const price = parseFloat(productData.price.toString());
    let finalPrice = price;
    
    if (productData.discountPercent) {
      finalPrice = price * (1 - (productData.discountPercent / 100));
    }
    
    // Generate slug safely
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Add timestamp to ensure uniqueness
    const finalSlug = `${slug}-${Date.now()}`;
    
    // Add this near the beginning of the POST function
    console.log("Received images data:", images);

    // And add this right before creating the product
    console.log("Formatted image data for DB:", images.map((image: { url: string; alt: string; isPrimary: boolean }) => ({
      url: image.url,
      alt: image.alt,
      isPrimary: image.isPrimary
    })));

    // Create product with related images
    const product = await prisma.product.create({
      data: {
        ...productData,
        slug: finalSlug,
        finalPrice: finalPrice,
        createdById: session.user.id,
        images: {
          create: images.map((image: { url: string; alt: string; isPrimary: boolean }) => ({
            url: image.url,
            alt: image.alt,
            isPrimary: image.isPrimary
          }))
        },
        categories: categories?.length > 0 ? {
          create: categories.map((categoryName: string) => ({
            category: {
              connectOrCreate: {
                where: { name: categoryName },
                create: { 
                  name: categoryName,
                  slug: categoryName.toLowerCase().replace(/\s+/g, '-')
                }
              }
            }
          }))
        } : undefined
      },
      include: { images: true },
    });
    
    console.log("Created product with images:", product.images);
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, session) => {
    try {
      // Parse query parameters
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const limit = parseInt(searchParams.get('limit') || '20');
      
      // Fetch products with images
      const products = await prisma.product.findMany({
        where: {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        include: {
          images: true,
          categories: {
            include: {
              category: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      // Transform for easier frontend use
      const formattedProducts = products.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        status: product.isPublished ? 'Published' : 'Draft',
        lastUpdated: formatDate(product.updatedAt),
        price: formatPrice(product.price),
        sales: product.purchaseCount,
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary
        })),
        categories: product.categories.map(c => c.category.name)
      }));
      
      return NextResponse.json(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
  });
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