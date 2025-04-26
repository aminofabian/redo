import { NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const paymentGateways = await prisma.paymentGateway.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        environment: true,
        businessName: true,
        supportsCreditCards: true,
        supportsDirectDebit: true,
      },
    });

    return NextResponse.json({ gateways: paymentGateways });
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment gateways' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 