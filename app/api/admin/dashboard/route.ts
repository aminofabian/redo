import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is logged in and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get recent sales data
    const recentSales = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          }
        }
      }
    });
    
    // Get sales statistics
    const totalSales = await prisma.order.count();
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });
    
    // Get user statistics
    const totalUsers = await prisma.user.count();
    const newUsersThisMonth = await prisma.user.count({
      where: {
        emailVerified: {
          gte: new Date(new Date().setDate(1))
        }
      }
    });
    
    // Get product statistics
    const totalProducts = await prisma.product.count();
    const featuredProducts = await prisma.product.count({
      where: {
        featured: true
      }
    });
    
    // Get top products by sales
    const topProducts = await prisma.product.findMany({
      take: 5,
      include: {
        _count: {
          select: { orderItems: true }
        },
        images: {
          where: {
            isPrimary: true
          },
          take: 1
        }
      }
    });
    
    // Format the response
    return NextResponse.json({
      salesOverview: {
        totalSales,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        recentSales: recentSales.map(order => ({
          id: order.id,
          date: order.createdAt,
          amount: order.totalAmount,
          status: order.status,
          user: order.user ? {
            name: order.user.name,
            email: order.user.email,
            image: order.user.image
          } : null,
          items: order.orderItems.length
        }))
      },
      userStats: {
        totalUsers,
        newUsersThisMonth
      },
      productStats: {
        totalProducts,
        featuredProducts,
        topProducts: topProducts.map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          sales: product._count.orderItems,
          image: product.images.length > 0 ? product.images[0].url : null
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 