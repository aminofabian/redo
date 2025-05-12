import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { safeJSONStringify } from '@/lib/json-utils';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Using global singleton for PrismaClient to prevent connection issues
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Handler for GET requests
export async function GET(request) {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

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
    });

    // Transform the data for the dashboard
    const currentDate = new Date();
    
    // Filter out duplicate products by keeping only the most recent purchase for each product
    const uniqueProductsMap = new Map();
    purchases.forEach(purchase => {
      const productId = purchase.productId;
      if (!uniqueProductsMap.has(productId) || 
          new Date(purchase.createdAt) > new Date(uniqueProductsMap.get(productId).createdAt)) {
        uniqueProductsMap.set(productId, purchase);
      }
    });
    
    // Convert map to array of unique purchases
    const uniquePurchases = Array.from(uniqueProductsMap.values());
    
    const purchasedMaterials = uniquePurchases.map(purchase => {
      const purchaseDate = new Date(purchase.createdAt);
      
      // Calculate days since purchase
      const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
      
      // Calculate progress percentage
      const progressPercentage = Math.min(Math.max(0, Math.floor((daysSincePurchase / 30) * 100)), 100);
      
      // Determine status based on progress
      const status = progressPercentage >= 100 ? 'completed' : 
                     progressPercentage > 0 ? 'in_progress' : 'not_started';
      
      // Calculate download expiry
      const downloadExpiryDays = process.env.DOWNLOAD_EXPIRY_DAYS ? 
                               parseInt(process.env.DOWNLOAD_EXPIRY_DAYS) : 60;
      
      const downloadExpiryDate = new Date(purchaseDate);
      downloadExpiryDate.setDate(downloadExpiryDate.getDate() + downloadExpiryDays);
      const daysUntilExpiry = Math.max(0, Math.floor((downloadExpiryDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)));
      
      // Determine file details
      const fileType = purchase.product.downloadUrl ? 
                      (purchase.product.downloadUrl.split('.').pop() || 'zip').toUpperCase() : 'PDF';
      
      return {
        id: purchase.id,
        title: purchase.product.title,
        description: purchase.product.description || '',
        type: purchase.product.type || (purchase.product.downloadUrl ? "Course" : "E-Book"),
        category: purchase.product.category || '',
        image: purchase.product.images[0]?.url || '',
        date: purchase.createdAt.toISOString().split('T')[0],
        formattedDate: purchaseDate.toLocaleDateString(),
        progress: progressPercentage,
        status: status,
        productId: purchase.productId,
        downloadUrl: purchase.product.downloadUrl || null,
        driveUrl: purchase.product.driveUrl || purchase.product.downloadUrl || '',
        isDownloadAvailable: currentDate < downloadExpiryDate,
        daysUntilExpiry: daysUntilExpiry,
        expiryDate: downloadExpiryDate.toISOString().split('T')[0],
        estimatedCompletionDate: new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        lastAccessed: purchase.lastAccessedAt ? new Date(purchase.lastAccessedAt).toISOString() : purchaseDate.toISOString(),
        fileSize: purchase.product.fileSize || '',
        fileFormat: fileType,
        totalLessons: purchase.product.totalLessons || 0,
        completedLessons: Math.floor(progressPercentage / 100 * (purchase.product.totalLessons || 10)),
        rating: purchase.product.rating || 0,
        author: purchase.product.author || ''
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