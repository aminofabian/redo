import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    // Check if user is logged in and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total user count
    const total = await prisma.user.count();
    
    // Get count of users by role
    const verified = await prisma.user.count({
      where: { role: 'VERIFIED_USER' }
    });
    
    const regular = await prisma.user.count({
      where: { role: 'USER' }
    });
    
    const admin = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    // Count users with emailVerified = null (pending verification)
    const pending = await prisma.user.count({
      where: { emailVerified: null }
    });

    return NextResponse.json({
      total,
      verified,
      regular,
      admin,
      pending
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
} 