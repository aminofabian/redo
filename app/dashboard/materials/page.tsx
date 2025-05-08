import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MaterialsClient from "./materials-client";
import type { Session } from "next-auth";

export default async function MaterialsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Explicit type cast to ensure compatibility with MaterialsClient
  return <MaterialsClient session={session as Session} />;
}
