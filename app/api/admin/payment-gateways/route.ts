import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the session token from cookies
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Check if user is authenticated and is an admin
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch existing gateways
    const gateways = await prisma.paymentGateway.findMany();
    
    // If no gateways exist, set default ones for the response
    if (gateways.length === 0) {
      return NextResponse.json({
        gateways: [
          {
            id: 'new-stripe',
            name: 'STRIPE',
            isActive: false,
            config: { apiKey: '', webhookSecret: '', testMode: true },
            description: 'Stripe payment gateway',
            notes: ''
          },
          {
            id: 'new-paypal',
            name: 'PAYPAL',
            isActive: false,
            config: { clientId: '', clientSecret: '', sandbox: true },
            description: 'PayPal payment gateway',
            notes: ''
          }
        ]
      });
    }
    
    return NextResponse.json({ gateways });
    
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session token from cookies
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Check if user is authenticated and is an admin
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { gateways } = await request.json();
    
    if (!gateways || !Array.isArray(gateways)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Check if PaymentGateway model exists on prisma
    if (!prisma.paymentGateway) {
      console.error("PaymentGateway model not found in Prisma client");
      return NextResponse.json({ 
        error: 'Database schema not updated. Run npx prisma generate and npx prisma db push.' 
      }, { status: 500 });
    }
    
    // Process each gateway
    const savedGateways = await Promise.all(
      gateways.map(async (gateway) => {
        console.log("Processing gateway:", gateway.name, "with ID:", gateway.id);
        
        try {
          // For new gateways (id starts with 'new-' or is empty)
          if (!gateway.id || gateway.id.startsWith('new-')) {
            // Check if gateway with this name already exists
            const existing = await prisma.paymentGateway.findUnique({
              where: { name: gateway.name }
            });
            
            if (existing) {
              // Update existing gateway
              return prisma.paymentGateway.update({
                where: { id: existing.id },
                data: {
                  isActive: gateway.isActive,
                  config: gateway.config,
                  description: gateway.description,
                  notes: gateway.notes,
                }
              });
            } else {
              // Create new gateway
              return prisma.paymentGateway.create({
                data: {
                  name: gateway.name,
                  isActive: gateway.isActive,
                  config: gateway.config,
                  description: gateway.description,
                  notes: gateway.notes,
                }
              });
            }
          } else {
            // Update existing gateway
            return prisma.paymentGateway.update({
              where: { id: gateway.id },
              data: {
                isActive: gateway.isActive,
                config: gateway.config,
                description: gateway.description,
                notes: gateway.notes,
              }
            });
          }
        } catch (err) {
          console.error(`Error processing gateway ${gateway.name}:`, err);
          // Return the gateway as-is if there's an error
          return gateway;
        }
      })
    );
    
    return NextResponse.json({ 
      success: true,
      gateways: savedGateways
    });
    
  } catch (error) {
    console.error('Error updating payment gateways:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 