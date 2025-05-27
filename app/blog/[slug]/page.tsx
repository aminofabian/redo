"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, User, Tag, Eye } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
  category?: string;
  author: {
    name: string;
    image?: string;
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  // For preview, we'll get post data from localStorage if available
  useEffect(() => {
    const checkLocalStorage = () => {
      try {
        if (typeof window !== "undefined" && slug === "preview") {
          const storedPost = localStorage.getItem("blogPostPreview");
          if (storedPost) {
            const parsedPost = JSON.parse(storedPost);
            console.log("Preview data from localStorage:", parsedPost);
            
            // Set preview flag
            setIsPreview(true);
            
            setPost({
              id: "preview",
              title: parsedPost.title || "Preview Post",
              content: parsedPost.content || "",
              imageUrl: parsedPost.imageUrl || "", // Ensure imageUrl is properly handled
              published: parsedPost.published || false,
              createdAt: new Date().toISOString(),
              category: "", // No longer using categories
              author: {
                name: "Preview Author",
                image: "/placeholder-avatar.jpg",
              },
            });
            setLoading(false);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Error checking localStorage:", error);
        return false;
      }
    };

    const fetchPost = async () => {
      // First check if this is a preview from localStorage
      if (checkLocalStorage()) return;
      
      try {
        // This would be a real API call in production
        // const res = await fetch(`/api/blog/post/${slug}`);
        // const data = await res.json();
        
        // For now, create a mock post
        setPost({
          id: "1",
          title: "Understanding NCLEX-RN Test Strategies",
          content: `
            <h1>Understanding NCLEX-RN Test Strategies</h1>
            <p>The NCLEX-RN exam is a comprehensive test that evaluates your knowledge and abilities essential for safe and effective nursing practice. Success in this exam requires not only a solid understanding of nursing concepts but also strategic test-taking skills.</p>
            
            <h2>Key Test-Taking Strategies</h2>
            
            <p>When approaching NCLEX-RN questions, remember these essential strategies:</p>
            
            <ul>
              <li>Read the entire question carefully before looking at the answers</li>
              <li>Look for keywords that may change the meaning of the question</li>
              <li>Identify what the question is actually asking</li>
              <li>Consider the nursing process: Assessment, Diagnosis, Planning, Implementation, Evaluation</li>
              <li>Apply Maslow's Hierarchy of Needs</li>
              <li>Prioritize using the ABCs (Airway, Breathing, Circulation)</li>
            </ul>
            
            <h2>Practice Makes Perfect</h2>
            
            <p>Regular practice with NCLEX-style questions is crucial for success. This helps you:</p>
            
            <ul>
              <li>Become familiar with the question format</li>
              <li>Improve your time management</li>
              <li>Identify your weak areas</li>
              <li>Build confidence for the actual exam</li>
            </ul>
            
            <p>Remember, the NCLEX is not just testing your knowledge, but your ability to apply that knowledge in clinical situations. Practice questions that require critical thinking and application of concepts will best prepare you for success.</p>
          `,
          imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
          published: true,
          createdAt: "2025-05-15T09:00:00.000Z",
          category: "University of Harvard",
          author: {
            name: "Dr. Sarah Johnson",
            image: "/placeholder-avatar.jpg",
          },
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link href="/blog" className="text-[#1e2c51] hover:underline">
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-12 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#1e2c51]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>
        </div>
        
        {/* Preview notification */}
        {slug === "preview" && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <Eye className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This is a preview of your blog post. It has not been published yet.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Post header */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        {/* Post metadata */}
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-8">
          <div className="flex items-center mr-6 mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(post.createdAt).toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </div>
          
          <div className="flex items-center mr-6 mb-2">
            <User className="h-4 w-4 mr-1" />
            {post.author.name}
          </div>
          
          {post.category && (
            <div className="flex items-center mb-2">
              <Tag className="h-4 w-4 mr-1" />
              {post.category}
            </div>
          )}
        </div>
        
        {/* Featured image */}
        {post.imageUrl && (
          <div className="mb-8 -mx-4 sm:mx-0 rounded-lg overflow-hidden">
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-auto max-h-[500px] object-cover" 
            />
          </div>
        )}
        
        {/* Post content */}
        <style jsx global>{`
          .blog-content h1 {
            font-size: 2.25rem;
            margin-top: 2.5rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
            line-height: 1.2;
            color: #1a202c;
          }
          
          .blog-content h2 {
            font-size: 1.75rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 700;
            line-height: 1.3;
            color: #1a202c;
          }
          
          .blog-content h3 {
            font-size: 1.5rem;
            margin-top: 1.75rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
            line-height: 1.4;
            color: #1a202c;
          }
          
          .blog-content p {
            margin-top: 1.25rem;
            margin-bottom: 1.25rem;
            line-height: 1.7;
            color: #4a5568;
          }
          
          .blog-content ul, .blog-content ol {
            margin-top: 1.25rem;
            margin-bottom: 1.25rem;
            padding-left: 1.5rem;
          }
          
          .blog-content li {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            color: #4a5568;
          }
          
          .blog-content ul li {
            list-style-type: disc;
          }
          
          .blog-content ol li {
            list-style-type: decimal;
          }
          
          .blog-content a {
            color: #1e40af;
            text-decoration: underline;
          }
          
          .blog-content blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1rem;
            font-style: italic;
            margin-left: 0;
            margin-right: 0;
            color: #4a5568;
          }
          
          .blog-content img {
            margin-top: 2rem;
            margin-bottom: 2rem;
            border-radius: 0.375rem;
            max-width: 100%;
            height: auto;
            display: block;
          }
          
          .blog-content code {
            background-color: #f7fafc;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: monospace;
            font-size: 0.875rem;
            color: #1a202c;
          }
          
          .blog-content pre {
            background-color: #f7fafc;
            padding: 1rem;
            border-radius: 0.375rem;
            overflow-x: auto;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .blog-content pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
            color: #1a202c;
          }
          
          .blog-content table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .blog-content th, .blog-content td {
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
          }
          
          .blog-content th {
            background-color: #f7fafc;
            font-weight: 600;
            text-align: left;
          }
        `}</style>
        <div 
          className="blog-content text-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        ></div>
        
        {/* Author info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
              {post.author.image ? (
                <img 
                  src={post.author.image} 
                  alt={post.author.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-full w-full p-2 text-gray-500" />
              )}
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">{post.author.name}</h3>
              <p className="text-sm text-gray-500">Author</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
