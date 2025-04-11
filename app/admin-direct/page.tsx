import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDirectPage() {
  const session = await getServerSession(authOptions);
  
  // Debug the session
  console.log("Admin direct page - Server session:", session);
  
  // No session at all - redirect to login
  if (!session) {
    redirect("/auth/login");
  }
  
  // Not admin - redirect to dashboard
  const isAdmin = session.user?.role === "ADMIN";
  if (!isAdmin) {
    console.log("User is not admin. Role:", session.user?.role);
    redirect("/dashboard");
  }
  
  // User passed all checks and is an admin
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-green-100 p-6 rounded-lg border border-green-300">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Admin Access Successful!</h1>
        <p className="mb-4">You have successfully accessed the admin area outside of middleware.</p>
        <p className="font-medium">Email: {session.user.email}</p>
        <p className="font-medium">Role: {session.user.role}</p>
        
        <div className="mt-6">
          <a href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Try regular admin page
          </a>
        </div>
      </div>
    </div>
  );
} 