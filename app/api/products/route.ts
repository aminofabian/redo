import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from "@/auth";
import { auth } from "@/auth";
import { safeJSONStringify } from '@/lib/json-utils';
import { Prisma, Product, ProductImage } from '@prisma/client';

interface CategoryInput {
  id?: string;
  path: string;
}

interface ImageInput {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ProductWithImages extends Product {
  images: ProductImage[];
}

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
  id: number | bigint;
  title: string;
  description: string | null;
  isPublished: boolean;
  updatedAt: Date;
  price: Prisma.Decimal | number;
  purchaseCount: number;
  images: Image[];
  categories: Category[];
}

// Using Next.js 14's preferred export syntax as noted in memory fix for 405 errors
export const POST = async (request: NextRequest) => {
  try {
    // Parse request data once
    const data = await request.json();
    const session = await auth();
    
    // Check if user is logged in and has proper session
    const userId = session?.user?.email ? 
      (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id : 
      null;
      
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }
      
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
      
      console.log('=== PRODUCT CREATION DEBUG ===');
      console.log('Raw request data:', JSON.stringify(data));
      console.log('Images from request:', data.images ? 'Present' : 'Missing');
      
      if (data.images) {
        console.log('Images array length:', data.images.length);
        console.log('First image sample:', data.images && data.images.length > 0 ? JSON.stringify(data.images[0]) : 'None');
      } else {
        console.log('CRITICAL: No images in request data!');
      }
      
      // Check if images is actually an array
      if (!Array.isArray(data.images)) {
        console.error('Images is not an array:', typeof data.images);
        data.images = []; // Initialize as empty array if not an array
      }
      
      // This variable will be defined outside the try/catch so we can use it in both scopes
      let product;

      try {
        console.log('Creating product with these images:', JSON.stringify(data.images));
        
        // First create product without any relationships
        product = await prisma.product.create({
          data: {
            ...productData,
            slug: finalSlug,
            finalPrice: finalPrice,
            createdById: userId, // Use the verified userId we retrieved
          },
        });
        
        console.log('Product created with ID:', product.id);
        console.log('Now adding images...');
        
        // Add images separately if they exist
        if (data.images && data.images.length > 0) {
          // Create images one by one to better track any issues
          for (const img of data.images) {
            try {
              console.log('Creating image with URL:', img.url);
              await prisma.productImage.create({
                data: {
                  url: img.url,
                  alt: img.alt || '',
                  isPrimary: img.isPrimary || false,
                  product: { connect: { id: product.id } }
                }
              });
              console.log('Image created successfully');
            } catch (imgError) {
              console.error('Failed to create image:', imgError);
            }
          }
        } else {
          console.log('No images to add to product');
        }
        
        // Get the updated product with images
        const updatedProductWithImages = await prisma.product.findUnique({
          where: { id: product.id },
          include: { images: true }
        });
        
        console.log('Final product with images:', JSON.stringify(
          updatedProductWithImages, 
          (key, value) => typeof value === 'bigint' ? value.toString() : value
        ));
        
        // Use the product with images for subsequent operations
        if (updatedProductWithImages) {
          product = updatedProductWithImages;
        }
        
        console.log('=== END DEBUG ===');
      } catch (productError) {
        console.error('Error creating product or images:', productError);
        throw productError; // Re-throw to be caught by the outer catch block
      }
      
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
      
      // Type assertion for product with images to satisfy TypeScript
      const productWithImages = product as unknown as ProductWithImages;
      console.log("Created product with images:", productWithImages.images);
      
      // Use safeJSONStringify to handle BigInt values
      const serializedProduct = JSON.parse(safeJSONStringify(product));
      return NextResponse.json(serializedProduct);
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
      const formattedProducts = products.map((product) => ({
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