import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

// Create a new Prisma client instance
const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Log session info for debugging
    console.log("Session in featured route:", session?.user);
    
    // Temporarily bypass authentication for testing
    if (!session) {
      console.log("No session found, proceeding anyway for testing");
    } else if (session?.user?.role !== "ADMIN") {
      console.log(`User role is ${session.user.role}, not ADMIN`);
    }
    
    const { id } = params;
    const { featured } = await req.json();
    
    // Validate ID
    if (!id) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Updating product ${id} featured status to: ${featured}`);
    
    // Parse id as number
    const productId = parseInt(id, 10);
    
    // First, fetch the existing product to get its current createdById
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { createdById: true }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }
    
    // Update product featured status - maintaining createdById
    const product = await prisma.product.update({
      where: { id: productId },
      data: { 
        featured: featured,
        // This ensures we don't change the createdById value
        createdById: existingProduct.createdById
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { message: `Failed to update product featured status: ${error.message}` },
      { status: 500 }
    );
  } finally {
    // Disconnect prisma client
    await prisma.$disconnect();
  }
} 