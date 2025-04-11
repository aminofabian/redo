"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { AdminProvider } from "@/contexts/AdminContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div>
        <DashboardNav />
        <div className="flex pt-[57px]">
          <main className="flex-1 min-h-[calc(100vh-57px)] bg-gray-50 p-3">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
} 