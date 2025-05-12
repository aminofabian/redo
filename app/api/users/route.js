import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await auth();
    
    // Check if user is logged in and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Query users with search filter
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true
      },
      take: 20,
      orderBy: {
        id: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 