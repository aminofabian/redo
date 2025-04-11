"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ForceReauthButton } from "@/components/auth/ForceReauthButton";

export default function AuthDebugPage() {
  const { data: session, status } = useSession();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTokenData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug/token');
      const data = await res.json();
      setTokenData(data);
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTokenData();
    }
  }, [status]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Debugging</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Session Status: {status}</h2>
          
          {status === 'authenticated' ? (
            <div>
              <div className="mb-4 p-3 bg-green-100 rounded">
                <p className="text-green-800 font-medium">Authenticated as: {session?.user?.email}</p>
                <p className="text-green-800">Role: {session?.user?.role || 'Not set'}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Session Data:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          ) : status === 'loading' ? (
            <p>Loading session...</p>
          ) : (
            <div className="mb-4 p-3 bg-red-100 rounded">
              <p className="text-red-800 font-medium">Not authenticated</p>
            </div>
          )}
          
          <div className="mt-4">
            <ForceReauthButton />
          </div>
        </section>
        
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Token Information</h2>
          
          <button 
            onClick={fetchTokenData}
            disabled={loading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Token Data'}
          </button>
          
          {tokenData ? (
            <div>
              <h3 className="font-semibold mb-2">Token Data:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(tokenData, null, 2)}
              </pre>
            </div>
          ) : (
            <p>No token data available</p>
          )}
        </section>
        
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Quick Links</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/admin-test" className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-center">
              Admin Test Page
            </a>
            <a href="/admin-direct-login" className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-center">
              Direct Admin Login
            </a>
            <a href="/api/debug/auth" className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-center">
              API: Debug Auth
            </a>
            <a href="/api/debug/token" className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-center">
              API: Debug Token
            </a>
          </div>
        </section>
      </div>
    </div>
  );
} 