import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { UserRole } from "@prisma/client";

export async function isAdmin() {
  const session = await getServerSession(authOptions);
  console.log("Admin check - session:", session);
  
  if (!session) return false;
  
  const isAdmin = session.user?.role === UserRole.ADMIN;
  console.log("Is admin:", isAdmin, "Role:", session.user?.role);
  
  return isAdmin;
} 