// app/api/dashboard/materials/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/src/generated/client';

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

    // Transform the data for the dashboard
    const purchasedMaterials = purchases.map(purchase => {
      const daysOwned = Math.floor((new Date().getTime() - new Date(purchase.createdAt).getTime()) / (1000 * 3600 * 24));
      
      // Calculate a simulated progress based on days owned (just for demonstration)
      // In a real system, you'd track actual progress in a separate table
      const progress = Math.min(Math.floor((daysOwned / 30) * 100), 100);
      
      return {
        id: purchase.id,
        title: purchase.product.title,
        type: purchase.product.downloadUrl ? "Course" : "E-Book",
        image: purchase.product.images[0]?.url || null,
        date: purchase.createdAt.toISOString().split('T')[0],
        progress: progress,
        productId: purchase.productId
      };
    });

    return NextResponse.json(purchasedMaterials);
  } catch (error) {
    console.error('Error fetching purchased materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased materials' },
      { status: 500 }
    );
  }
}
