import { NextResponse } from "next/server";
import db from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, adminPassword } = await req.json();
    
    // Simple security check - you should use a more secure method
    if (adminPassword !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const updatedUser = await db.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
    });
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error making user admin:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
} 