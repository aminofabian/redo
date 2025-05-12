import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const numericId = parseInt(params.id);
    
    // Ensure the ID is valid
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    const { slug } = await request.json();
    
    // Validate slug format
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens." },
        { status: 400 }
      );
    }
    
    // Check if slug is already in use
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });
    
    if (existingProduct && existingProduct.id !== BigInt(numericId)) {
      return NextResponse.json(
        { error: "This URL slug is already in use by another product." },
        { status: 409 }
      );
    }
    
    // Update the product slug
    const product = await prisma.product.update({
      where: { id: numericId },
      data: { slug }
    });
    
    return NextResponse.json({
      ...product,
      id: String(product.id) // Convert to string for frontend consistency
    });
  } catch (error) {
    console.error('Error updating product slug:', error);
    return NextResponse.json(
      { error: "Failed to update product slug" },
      { status: 500 }
    );
  }
} 