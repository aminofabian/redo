import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

export default function BlogIndexPage() {
  // Mock blog posts data (in production, this would come from an API)
  const posts = [
    {
      id: "1",
      slug: "understanding-nclex-rn-test-strategies",
      title: "Understanding NCLEX-RN Test Strategies",
      excerpt: "The NCLEX-RN exam is a comprehensive test that evaluates your knowledge and abilities essential for safe and effective nursing practice. Success in this exam requires not only a solid understanding of nursing concepts but also strategic test-taking skills.",
      imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      createdAt: "2025-05-15T09:00:00.000Z",
      category: "University of Harvard",
      author: {
        name: "Dr. Sarah Johnson",
      },
    },
    {
      id: "2",
      slug: "top-10-nursing-study-resources",
      title: "Top 10 Nursing Study Resources for University Students",
      excerpt: "Nursing education requires access to quality resources that help students understand complex concepts and prepare for clinical practice. This post highlights the top 10 resources every nursing student should know about.",
      imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      createdAt: "2025-05-10T09:00:00.000Z",
      category: "University of Stanford",
      author: {
        name: "Michael Brown",
      },
    },
    {
      id: "3",
      slug: "pharmacology-basics-for-nursing-students",
      title: "Pharmacology Basics for Nursing Students",
      excerpt: "Pharmacology can be one of the most challenging subjects for nursing students. This guide breaks down the essential concepts every nursing student needs to understand about medications and their effects.",
      imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      createdAt: "2025-05-05T09:00:00.000Z",
      category: "Pharmacology",
      author: {
        name: "Dr. Emily Chen",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-12 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nursing Education Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert insights, study tips, and resources for nursing students at top universities
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="h-48 overflow-hidden">
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                {post.category && (
                  <div className="mb-2">
                    <span className="text-xs font-medium bg-[#1e2c51]/10 text-[#1e2c51] px-2 py-1 rounded">
                      {post.category}
                    </span>
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-auto">
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(post.createdAt).toLocaleDateString("en-US", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                    <span className="mx-2">•</span>
                    {post.author.name}
                  </div>
                  <Link 
                    href={`/blog/${post.slug}`} 
                    className="inline-flex items-center text-[#1e2c51] font-medium hover:underline"
                  >
                    Read More
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
