import { Metadata } from "next";
import AdminLayout from "@/components/admin/AdminLayout";
import { auth } from "@/lib/auth";
import BlogPostsList from "@/components/admin/blog/BlogPostsList";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog Management | Admin Dashboard",
  description: "Manage blog posts for your website",
};

export default async function BlogPostsPage() {
  const session = await auth();

  return (
    <AdminLayout>
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-[#1e2c51]/10">
                <FileText className="h-6 w-6 text-[#1e2c51]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
                <p className="text-sm text-gray-500">Manage your blog content</p>
              </div>
            </div>
            <Link 
              href="/admin/content/blog/new" 
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e2c51] text-white rounded-md hover:bg-[#1e2c51]/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New Post
            </Link>
          </div>
          
          <BlogPostsList />
        </div>
      </div>
    </AdminLayout>
  );
}
