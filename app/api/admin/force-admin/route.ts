import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Get the email from the request
    const { email, secretKey } = await req.json();
    
    // Validate request
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    
    // Simple security check - require a secret key from .env
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Unauthorized access" }, 
        { status: 401 }
      );
    }
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Update user to ADMIN role
    const updatedUser = await db.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true }
    });
    
    return NextResponse.json({
      success: true,
      message: `User ${email} has been made an admin`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Force admin error:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
} 