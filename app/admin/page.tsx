// This is a Server Component (no "use client" directive)
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import PaymentGatewaySettings from '@/components/admin/PaymentGatewaySettings';

// 1. Create an interface that matches your session structure
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
    redirect("/auth/login");
  }
  
  return <AdminClient />;
} 