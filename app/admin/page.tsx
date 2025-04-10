// This is a Server Component (no "use client" directive)
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { signOut } from '@/lib/auth';

// 1. Create an interface that matches your session structure
interface AdminSession {
  user?: {
    id?: string;
    email?: string;
    role?: string;
    name?: string;
  }
}

export default async function AdminPage() {
  const sessionResult = await auth();
  
  // Use a type assertion to tell TypeScript what the structure is
  type AuthResult = { user?: { role?: string, [key: string]: any } };
  const typedSession = sessionResult as AuthResult;
  
  // Now we can safely access properties
  const session = typedSession ? {
    user: {
      ...(typedSession.user || {}),
      role: typedSession.user?.role || "USER"
    }
  } : null;
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  
  return <AdminClient />;
} 