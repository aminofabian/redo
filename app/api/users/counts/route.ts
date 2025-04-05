import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get total users count
    const totalCount = await prisma.user.count();
    
    // Get users by role using correct enum values from schema
    const verifiedCount = await prisma.user.count({
      where: {
        role: UserRole.VERIFIED_USER
      }
    });
    
    const regularCount = await prisma.user.count({
      where: {
        role: UserRole.USER
      }
    });
    
    const adminCount = await prisma.user.count({
      where: {
        role: UserRole.ADMIN
      }
    });
    
    const pendingCount = await prisma.user.count({
      where: {
        emailVerified: null
      }
    });
    
    return NextResponse.json({
      total: totalCount,
      verified: verifiedCount,
      regular: regularCount,
      admin: adminCount,
      pending: pendingCount
    });
  } catch (error) {
    console.error('Error fetching user counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user counts' },
      { status: 500 }
    );
  }
} 