import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { safeJSONStringify } from '@/lib/json-utils';
import type { User } from 'next-auth';

// Initialize PrismaClient (with singleton pattern for development)
const prisma = new PrismaClient();

// Define the GET handler as a named export
export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add type assertion to ensure TypeScript recognizes the id property from our extended User type
    const user = session.user as User & { id: string };
    const userId = user.id;

    // Get user's purchased materials with product details
    const purchases = await prisma.purchase.findMany({
      where: {
        userId,
        status: 'completed',
      },
      include: {
        product: {
          include: {
            images: {
              where: {
                isPrimary: true
              },
              take: 1
            },
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
      // Removed the take: 4 limit to show all purchased materials
    });

    // Transform the data for the dashboard - using the existing database schema
    const currentDate = new Date();
    
    // Filter out duplicate products by keeping only the most recent purchase for each product
    const uniqueProductsMap = new Map();
    purchases.forEach(purchase => {
      const productId = purchase.productId;
      // If this product hasn't been seen yet, or this purchase is more recent than the one we've seen
      if (!uniqueProductsMap.has(productId) || 
          new Date(purchase.createdAt) > new Date(uniqueProductsMap.get(productId).createdAt)) {
        uniqueProductsMap.set(productId, purchase);
      }
    });
    
    // Convert map to array of unique purchases
    const uniquePurchases = Array.from(uniqueProductsMap.values());
    
    const purchasedMaterials = uniquePurchases.map(purchase => {
      const purchaseDate = new Date(purchase.createdAt);
      
      // Calculate days since purchase (will be needed for various calculations)
      const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
      
      // Look for activity logs or other indicators of progress in your existing schema
      // For now, we'll base progress on days since purchase, but you could replace this
      // with a query to your activity or progress tracking table once implemented
      const progressPercentage = Math.min(Math.max(0, Math.floor((daysSincePurchase / 30) * 100)), 100);
      
      // Determine status based on progress
      const status = progressPercentage >= 100 ? 'completed' : 
                     progressPercentage > 0 ? 'in_progress' : 'not_started';
      
      // Calculate download expiry (could be retrieved from environment variables or settings table)
      // This uses a standard 60-day policy but could be replaced with a dynamic value
      const downloadExpiryDays = process.env.DOWNLOAD_EXPIRY_DAYS ? 
                               parseInt(process.env.DOWNLOAD_EXPIRY_DAYS) : 60;
      
      const downloadExpiryDate = new Date(purchaseDate);
      downloadExpiryDate.setDate(downloadExpiryDate.getDate() + downloadExpiryDays);
      const daysUntilExpiry = Math.max(0, Math.floor((downloadExpiryDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)));
      
      // Determine file details from the product metadata
      // You can add these fields to your product or productDetails table later
      const fileType = purchase.product.downloadUrl ? 
                      (purchase.product.downloadUrl.split('.').pop() || 'zip').toUpperCase() : 'PDF';
      
      // Use the actual product metadata from your database
      return {
        id: purchase.id,
        title: purchase.product.title,
        description: purchase.product.description || '',
        type: (purchase.product as any).type || (purchase.product.downloadUrl ? "Course" : "E-Book"),
        category: (purchase.product as any).category || '',
        image: purchase.product.images[0]?.url || '',
        date: purchase.createdAt.toISOString().split('T')[0],
        formattedDate: purchaseDate.toLocaleDateString(),
        progress: progressPercentage,
        status: status,
        productId: purchase.productId,
        downloadUrl: purchase.product.downloadUrl || null,
        driveUrl: (purchase.product as any).driveUrl || purchase.product.downloadUrl || '',
        isDownloadAvailable: currentDate < downloadExpiryDate,
        daysUntilExpiry: daysUntilExpiry,
        expiryDate: downloadExpiryDate.toISOString().split('T')[0],
        estimatedCompletionDate: new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        lastAccessed: (purchase as any).lastAccessedAt ? new Date((purchase as any).lastAccessedAt).toISOString() : purchaseDate.toISOString(),
        fileSize: (purchase.product as any).fileSize || '',
        fileFormat: fileType,
        totalLessons: (purchase.product as any).totalLessons || 0,
        completedLessons: Math.floor(progressPercentage / 100 * ((purchase.product as any).totalLessons || 10)),
        rating: (purchase.product as any).rating || 0,
        author: (purchase.product as any).author || ''
      };
    });

    // Use safe JSON serialization to handle BigInt values
    const safeData = JSON.parse(safeJSONStringify(purchasedMaterials));
    return NextResponse.json(safeData);
  } catch (error) {
    console.error('Error fetching purchased materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased materials', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
