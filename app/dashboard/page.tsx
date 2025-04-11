import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { Session } from "next-auth";

export default async function DashboardPage() {
  const session = await auth();
  
  console.log("Dashboard server component - session:", session);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return <DashboardClient session={session as Session} />;
} 