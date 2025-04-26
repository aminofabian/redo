import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// Define an interface for the image type
interface ImageInput {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export async function POST(request: Request) {
  try {
    // Use the auth() function directly - this is the recommended approach with Next Auth
    const session = await auth();
    
    // Parse the request body
    const data = await request.json();
    
    // Check authentication - but make it optional
    let createdByConnect = {};
    if (session && session.user?.id) {
      createdByConnect = {
        createdBy: {
          connect: { id: session.user.id }
        }
      };
    }
    
    // First, create the product without a finalized slug
    // We'll update it after we know the ID
    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description || "",
        slug: data.slug, // temporary slug
        price: data.price,
        finalPrice: data.finalPrice,
        discountPercent: data.discountPercent,
        discountType: data.discountType || "percent",
        accessDuration: data.accessDuration,
        downloadLimit: data.downloadLimit,
        downloadUrl: data.downloadUrl,
        inStock: data.inStock || true,
        isPublished: data.isPublished || true,
        featured: data.featured || false,
        // Direct assignment instead of object spread
        ...(session?.user?.id 
          ? { createdBy: { connect: { id: session.user.id } } } 
          : {} as any),
        // Handle images if needed
        images: data.images && data.images.length > 0 ? {
          create: data.images.map((img: ImageInput) => ({
            url: img.url,
            alt: img.alt || "",
            isPrimary: img.isPrimary || false
          }))
        } : undefined,
      } as any
    });
    
    // Now update the slug to include the ID
    const finalSlug = `${data.slug}-${product.id}`;
    
    // Update the product with the final slug
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { slug: finalSlug }
    });
    
    // Handle category connections
    if (data.categories && data.categories.length > 0) {
      // Create category connections for each category path
      const categoryPromises = data.categories.map(async (categoryPath: string) => {
        try {
          // Option 1: Access using $queryRaw (safest option)
          await prisma.$executeRaw`
            INSERT INTO "CategoryPath" ("id", "productId", "path", "level1", "level2", "level3")
            VALUES (${crypto.randomUUID()}, ${product.id}, ${categoryPath}, ${categoryPath.split('/')[0] || null}, ${categoryPath.split('/')[1] || null}, ${categoryPath.split('/')[2] || null})
          `;
          
          // OR Option 2: Try lowercase model name
          // await prisma.categorypath.create({
          //   data: {
          //     product: { connect: { id: product.id } },
          //     path: categoryPath,
          //     level1: categoryPath.split('/')[0] || null,
          //     level2: categoryPath.split('/')[1] || null,
          //     level3: categoryPath.split('/')[2] || null,
          //   }
          // });
        } catch (error) {
          console.error(`Error connecting category ${categoryPath}:`, error);
        }
      });
      
      await Promise.all(categoryPromises);
    }
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Add an interface for the product data structure
interface ProductData {
  title: string;
  description?: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  discountType?: string;
  accessDuration?: number;
  downloadLimit?: number;
  downloadUrl?: string;
  inStock?: boolean;
  isPublished?: boolean;
  featured?: boolean;
  categories?: string[];
  images?: Array<{url: string; alt?: string; isPrimary?: boolean}>;
  [key: string]: any; // For any additional properties
}

async function saveProduct(data: ProductData, existingProductId: number | null = null, userId?: string) {
  const { categories, images, ...productDataBasic } = data;
  
  try {
    return await prisma.$transaction(async (tx) => {
      let product;
      
      // Handle creation and updates separately with proper typing
      if (existingProductId) {
        // For updates
        product = await tx.product.update({
          where: { id: existingProductId },
          data: {
            ...productDataBasic,
            // Images handling for updates
            ...(images && images.length > 0 ? {
              images: { create: images.map((img: ImageInput) => ({
                url: img.url,
                alt: img.alt || "",
                isPrimary: img.isPrimary || false
              }))}
            } : {})
          },
          include: { categories: true }
        });
      } else {
        // For creation
        product = await tx.product.create({
          data: {
            ...productDataBasic,
            ...(userId 
              ? { createdBy: { connect: { id: userId } } } 
              : {} as any),
            // Images handling for creation
            ...(images && images.length > 0 ? {
              images: { create: images.map((img: ImageInput) => ({
                url: img.url,
                alt: img.alt || "",
                isPrimary: img.isPrimary || false
              }))}
            } : {})
          },
          include: { categories: true }
        });
      }

      // If we're updating an existing product, first delete all existing category relationships
      if (existingProductId) {
        await tx.categoryProduct.deleteMany({
          where: { productId: product.id },
        });
      }

      // Create new category relationships
      if (categories && categories.length > 0) {
        const categoryConnections = categories.map(categoryId => ({
          productId: product.id,
          categoryId: categoryId,
        }));

        await tx.categoryProduct.createMany({
          data: categoryConnections,
        });
      }

      return product;
    });
  } catch (error) {
    console.error('Database error while saving product:', error);
    throw error;
  }
} 