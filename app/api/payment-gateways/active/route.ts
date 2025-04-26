import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch only active gateways
    const gateways = await prisma.paymentGateway.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    
    return NextResponse.json({ gateways });
  } catch (error) {
    console.error('Error fetching active payment gateways:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 