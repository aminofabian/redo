// app/api/user/purchased-products/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();

    // 🔒 Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch products that the user has purchased
    // Join Purchase table with Product table to get product details
    const purchasedProducts = await prisma.purchase.findMany({
      where: {
        userId,
        // Only include completed purchases
        status: 'completed',
      },
      select: {
        id: true,
        productId: true,
        amount: true,
        createdAt: true,
        status: true,
        accessExpires: true,
        downloadsLeft: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            price: true,
            finalPrice: true,
            downloadUrl: true,
            accessDuration: true,
            downloadLimit: true,
            images: {
              select: {
                id: true,
                url: true,
                alt: true,
                isPrimary: true,
              },
              where: {
                isPrimary: true,
              },
              take: 1,
            },
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    path: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(purchasedProducts, 'yes thats itssss')

    // Transform the data to make it more frontend-friendly
    const formattedProducts = purchasedProducts.map(purchase => {
      return {
        purchaseId: purchase.id,
        purchaseDate: purchase.createdAt,
        purchaseAmount: purchase.amount,
        purchaseStatus: purchase.status,
        accessExpires: purchase.accessExpires,
        downloadsLeft: purchase.downloadsLeft,
        product: {
          id: purchase.product.id,
          title: purchase.product.title,
          slug: purchase.product.slug,
          description: purchase.product.description,
          price: purchase.product.price,
          finalPrice: purchase.product.finalPrice,
          downloadUrl: purchase.product.downloadUrl,
          accessDuration: purchase.product.accessDuration,
          downloadLimit: purchase.product.downloadLimit,
          primaryImage: purchase.product.images[0] || null,
          categories: purchase.product.categories.map(cat => cat.category),
        },
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching purchased products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased products' },
      { status: 500 }
    );
  }
}