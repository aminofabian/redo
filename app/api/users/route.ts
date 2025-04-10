import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/auth';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth() as Session | null;
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Simplified query without filters or complex selections
    const users = await prisma.user.findMany({
      take: 10, // Limit to 10
    });
    
    console.log(`Found ${users.length} users`);
    
    // Return simplified user objects
    return NextResponse.json(
      users.map(user => ({
        id: user.id,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User',
        email: user.email,
        role: user.role,
        verified: !!user.emailVerified
      }))
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: String(error) },
      { status: 500 }
    );
  }
} 