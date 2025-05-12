import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from "@/auth";
import { safeJSONStringify } from '@/lib/json-utils';
import { Prisma } from '@prisma/client';

type Image = {
  id: string;
  url: string;
  isPrimary: boolean;
}

type Category = {
  category: {
    name: string;
  }
}

type ProductWithRelations = {
  id: bigint;
  title: string;
  description: string | null;
  isPublished: boolean;
  updatedAt: Date;
  price: Prisma.Decimal | number;
  purchaseCount: number;
  images: Image[];
  categories: Category[];
}

export async function POST(request: NextRequest) {
  try {
    return withAuth(request, async (req, session) => {
      const data = await request.json();
      
      // Add null checks for required fields
      if (!data.title) {
        return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
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
        downloadUrl: rawProductData.downloadLink,
        featured: rawProductData.featured,
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

      // Create product with related images (without categories first)
      const product = await prisma.product.create({
        data: {
          ...productData,
          slug: finalSlug,
          finalPrice: finalPrice,
          createdById: session.user.id,
          images: {
            create: images?.map((image: { url: string; alt: string; isPrimary: boolean }) => ({
              url: image.url,
              alt: image.alt,
              isPrimary: image.isPrimary
            })) || []
          }
        },
        include: { images: true },
      });
      
      // Handle category paths separately
      if (categories?.length > 0) {
        // Create category path entries for each category path
        const categoryPromises = categories.map(async (categoryPath: string) => {
          try {
            await prisma.categoryPath.create({
              data: {
                product: { connect: { id: product.id } },
                path: categoryPath,
                level1: categoryPath.split('/')[0] || null,
                level2: categoryPath.split('/')[1] || null,
                level3: categoryPath.split('/')[2] || null,
                level4: categoryPath.split('/')[3] || null,
                level5: categoryPath.split('/')[4] || null
              }
            });
          } catch (error) {
            console.error(`Error connecting category path ${categoryPath}:`, error);
          }
        });
        
        await Promise.all(categoryPromises);
      }
      
      console.log("Created product with images:", product.images);
      
      // Use safeJSONStringify to handle BigInt values
      const serializedProduct = JSON.parse(safeJSONStringify(product));
      return NextResponse.json(serializedProduct);
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
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
      const formattedProducts = products.map((product: ProductWithRelations) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        status: product.isPublished ? 'Published' : 'Draft',
        lastUpdated: formatDate(product.updatedAt),
        price: formatPrice(product.price),
        sales: product.purchaseCount,
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary
        })),
        categories: product.categories.map((c) => c.category.name)
      }));
      
      // Use safeJSONStringify to handle BigInt values
      const serializedProducts = JSON.parse(safeJSONStringify(formattedProducts));
      return NextResponse.json(serializedProducts);
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