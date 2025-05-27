import { Metadata } from "next";
import AdminLayout from "@/components/admin/AdminLayout";
import { auth } from "@/lib/auth";
import BlogPostEditor from "@/components/admin/blog/BlogPostEditor";

export const metadata: Metadata = {
  title: "Create Blog Post | Admin Dashboard",
  description: "Create a new blog post for your website",
};

export default async function NewBlogPostPage() {
  const session = await auth();

  return (
    <AdminLayout>
      <div className="py-8 px-4">
        <BlogPostEditor />
      </div>
    </AdminLayout>
  );
}
