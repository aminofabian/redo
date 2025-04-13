import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  // Your handler code
  return NextResponse.json({ message: "GET request handler" });
}

export async function POST(request: NextRequest) {
  try {
    const { email, adminPassword } = await request.json();
    
    if (adminPassword !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error making user admin:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

// Add other necessary handlers (PUT, DELETE, etc.) 