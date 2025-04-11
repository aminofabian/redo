import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthTestPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Not Authenticated</h1>
        <p>You are not logged in.</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Authentication Test</h1>
      <div className="mt-4">
        <p><strong>Logged in as:</strong> {session.user.email}</p>
        <p><strong>User ID:</strong> {session.user.id}</p>
        <p><strong>Role:</strong> {session.user.role}</p>
        <p><strong>Is Admin:</strong> {session.user.role === "ADMIN" ? "YES" : "NO"}</p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold">Full Session Data:</h2>
        <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      {session.user.role === "ADMIN" ? (
        <div className="mt-8 p-4 bg-green-100 rounded">
          <p className="font-bold text-green-800">Admin access verified!</p>
          <p>You can now <a href="/admin" className="text-blue-600 underline">go to admin dashboard</a>.</p>
        </div>
      ) : (
        <div className="mt-8 p-4 bg-yellow-100 rounded">
          <p className="font-bold text-yellow-800">You are not an admin.</p>
        </div>
      )}
    </div>
  );
} 