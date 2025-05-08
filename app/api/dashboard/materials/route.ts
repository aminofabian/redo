// app/api/dashboard/materials/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/src/generated/client';
import { safeJSONStringify } from '@/lib/json-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      },
      take: 4, // Limit to recent 4 purchases
    });

    // Transform the data for the dashboard - using the existing database schema
    const currentDate = new Date();
    const purchasedMaterials = purchases.map(purchase => {
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
