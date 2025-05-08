import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PaymentSettingsClient from "@/components/admin/PaymentSettingsClient";

export default async function PaymentSettingsPage() {
  const sessionData = await auth();
  
  // Handle type casting safely
  type SessionWithRole = { user?: { name?: string; email?: string; image?: string; role?: string } };
  const session = sessionData as SessionWithRole;
  
  // Check if user is authenticated and has ADMIN role
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }
  
  // Only pass serializable data to client components
  return <PaymentSettingsClient />;
}