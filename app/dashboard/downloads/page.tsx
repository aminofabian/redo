import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DownloadsClient from "./downloads-client";
import { Session } from "next-auth";

export default async function DownloadsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return <DownloadsClient session={session as Session} />;
} 