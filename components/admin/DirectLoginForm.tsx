"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function DirectLoginForm() {
  const [email, setEmail] = useState("leilakitto@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      console.log("Sign in result:", result);
      
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Redirect to admin test page after a short delay
        setTimeout(() => {
          window.location.href = "/admin-test";
        }, 2000);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Direct Admin Login</h2>
      
      {success ? (
        <div className="p-4 bg-green-100 text-green-800 rounded">
          Login successful! Redirecting to admin test page...
        </div>
      ) : (
        <form onSubmit={handleDirectLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in directly"}
          </button>
        </form>
      )}
    </div>
  );
} 