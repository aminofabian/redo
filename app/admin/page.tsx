// This is a Server Component (no "use client" directive)
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// Import icons if you have them
// import { BarChart, Users, ShoppingBag, FileText, Settings } from "lucide-react";

// Stats loading component
function StatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  // Protect the page
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back, {session.user.name || session.user.email}
        </div>
      </div>
      
      <Suspense fallback={<StatsLoading />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Total Products</div>
            <div className="text-2xl font-bold">25</div>
            <div className="text-xs text-green-600 mt-2">+3 this week</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Total Users</div>
            <div className="text-2xl font-bold">194</div>
            <div className="text-xs text-green-600 mt-2">+18 this month</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Total Sales</div>
            <div className="text-2xl font-bold">$4,285</div>
            <div className="text-xs text-green-600 mt-2">+15% vs last month</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Avg. Order Value</div>
            <div className="text-2xl font-bold">$45.62</div>
            <div className="text-xs text-red-600 mt-2">-2% vs last month</div>
          </div>
        </div>
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3">
            <Link 
              href="/admin/products/new" 
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded flex items-center"
            >
              {/* <ShoppingBag className="w-5 h-5 mr-3" /> */}
              <span>Add New Product</span>
            </Link>
            
            <Link 
              href="/admin/categories" 
              className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded flex items-center"
            >
              {/* <FileText className="w-5 h-5 mr-3" /> */}
              <span>Manage Categories</span>
            </Link>
            
            <Link 
              href="/admin/users" 
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded flex items-center"
            >
              {/* <Users className="w-5 h-5 mr-3" /> */}
              <span>View All Users</span>
            </Link>
            
            <Link 
              href="/admin/settings" 
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 p-4 rounded flex items-center"
            >
              {/* <Settings className="w-5 h-5 mr-3" /> */}
              <span>Site Settings</span>
            </Link>
          </div>
        </div>
        
        {/* Recent activity */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { user: "John Doe", action: "purchased", item: "JavaScript Basics Course", time: "10 minutes ago" },
              { user: "Sarah Smith", action: "registered", item: "", time: "1 hour ago" },
              { user: "Mike Johnson", action: "reviewed", item: "React Fundamentals", time: "3 hours ago" },
              { user: "Emily Davis", action: "purchased", item: "CSS Mastery Course", time: "5 hours ago" },
              { user: "David Wilson", action: "registered", item: "", time: "yesterday" }
            ].map((activity, i) => (
              <div key={i} className="flex items-start py-3 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm mr-3">
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <p>
                    <span className="font-semibold">{activity.user}</span>{" "}
                    <span className="text-gray-600">{activity.action}</span>{" "}
                    {activity.item && <span className="font-medium">{activity.item}</span>}
                  </p>
                  <span className="text-gray-500 text-sm">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/activity" className="block text-blue-600 mt-4 text-sm font-medium">
            View all activity →
          </Link>
        </div>
      </div>
    </div>
  );
} 