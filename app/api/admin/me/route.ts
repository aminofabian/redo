import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { User } from "next-auth";

interface ExtendedUser extends User {
  id: string;
  role: string;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user || (session.user as ExtendedUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const user = session.user as ExtendedUser;
    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { error: "Failed to load admin profile" },
      { status: 500 }
    );
  }
} 