"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, User, Eye } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  imageUrl: string;
  published: boolean;
  createdAt: string;
  author: {
    name: string;
    image: string;
  };
}

export default function BlogPreviewPage() {
  // Initialize with default values that match the BlogPost interface
  const [post, setPost] = useState<BlogPost>({
    id: "preview",
    title: "Untitled Post",
    slug: "preview",
    content: "",
    imageUrl: "",
    published: false,
    createdAt: new Date().toISOString(),
    author: {
      name: "Preview Author",
      image: "/placeholder-avatar.jpg",
    },
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Get preview data from localStorage
      const previewData = localStorage.getItem("blogPostPreview");
      if (!previewData) {
        console.warn("No preview data found in localStorage");
        setLoading(false);
        return;
      }

      const parsedPost = JSON.parse(previewData);
      
      // Log the parsed data for debugging
      console.log("Parsed preview data:", {
        title: parsedPost.title,
        hasImageUrl: !!parsedPost.imageUrl,
        contentLength: parsedPost.content?.length || 0
      });

      // Update only the fields that come from the parsed post
      setPost(prev => ({
        ...prev,
        title: parsedPost.title || prev.title,
        content: parsedPost.content || prev.content,
        imageUrl: parsedPost.imageUrl || prev.imageUrl,
        published: parsedPost.published || prev.published,
        metaTitle: parsedPost.metaTitle || prev.metaTitle,
        metaDescription: parsedPost.metaDescription || prev.metaDescription,
        slug: parsedPost.slug || prev.slug,
      }));
    } catch (error) {
      console.error("Error loading preview data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Since we always have a post (initialized with defaults), we don't need the !post check
  // But we can show a message if no content was loaded
  const hasContent = post.content || post.title !== 'Untitled Post';
  
  if (!hasContent) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link href="/admin/blog" className="flex items-center text-gray-700 hover:text-gray-900">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Editor
              </Link>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Eye className="h-4 w-4 mr-1" />
                Preview Mode - No Content
              </span>
            </div>
          </div>
        </header>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Preview Content Available</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              There's no blog post content to preview. Please add some content in the editor and click the preview button again.
            </p>
            <Link 
              href="/admin/blog" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin/blog" className="flex items-center text-gray-700 hover:text-gray-900">
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Editor
            </Link>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Eye className="h-4 w-4 mr-1" />
                Preview Mode
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Preview notification bar */}
      <div className="sticky top-0 z-50 bg-yellow-100 text-yellow-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">Preview Mode - This is how your post will look when published</span>
        </div>
        <Link
          href="/admin/content/blog"
          className="text-sm font-medium hover:underline"
        >
          Exit Preview
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin/content/blog"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to all posts
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center text-sm text-gray-500 mb-8">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(post.createdAt || "").toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            <span className="mx-2">•</span>
            <span>{post.author?.name || "Anonymous"}</span>
          </div>
        </div>

        {/* Featured image with better error handling and loading state */}
        <div className="mb-8 overflow-hidden rounded-lg shadow-md relative bg-gray-100 min-h-[200px] flex items-center justify-center">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-contain"
              onLoad={(e) => {
                // Image loaded successfully
                console.log("Image loaded successfully");
              }}
              onError={(e) => {
                const imgElement = e.currentTarget;
                console.error("Image failed to load in preview:", 
                  post.imageUrl.startsWith('data:') ? 
                    `[data URL, ${post.imageUrl.length} chars]` : 
                    post.imageUrl
                );
                
                // Replace with error message
                const container = imgElement.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div class="p-4 text-center text-red-600">
                      <p>Failed to load image preview</p>
                      <p class="text-xs text-gray-500 mt-1">
                        ${post.imageUrl.startsWith('data:') ? 
                          'Invalid image data' : 
                          `URL: ${post.imageUrl.substring(0, 100)}${post.imageUrl.length > 100 ? '...' : ''}`}
                      </p>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No featured image selected
            </div>
          )}
        </div>

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
              {post.author?.image ? (
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
              <h3 className="font-medium text-gray-900">{post.author?.name || "Anonymous"}</h3>
              <p className="text-sm text-gray-500">Author</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


