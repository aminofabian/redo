import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

// Use PrismaClient singleton to prevent connection exhaustion
import { db } from '@/lib/db';

// Helper function to safely handle BigInt serialization
const safeJSONStringify = (obj: any) => {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Safe response helper to handle BigInt
const safeNextResponse = (data: any, status = 200) => {
  return new Response(safeJSONStringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// GET all blog posts
export const GET = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const published = searchParams.get('published');
    
    // Base query
    let query: any = {};
    
    // Add filters if provided
    if (category) {
      query.category = category;
    }
    
    if (published !== null) {
      query.published = published === 'true';
    }

    const blogPosts = await db.blogPost.findMany({
      where: query,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return safeNextResponse({ blogPosts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return safeNextResponse({ error: 'Failed to fetch blog posts' }, 500);
  }
};

// POST a new blog post
export const POST = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return safeNextResponse({ error: 'Unauthorized' }, 401);
    }
    
    const body = await request.json();
    const { title, slug, content, imageUrl, published, category } = body;
    
    if (!title || !slug || !content) {
      return safeNextResponse({ error: 'Missing required fields' }, 400);
    }
    
    // Check if slug already exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug }
    });
    
    if (existingPost) {
      return safeNextResponse({ error: 'Slug already exists' }, 400);
    }
    
    const newPost = await db.blogPost.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        published: published || false,
        category,
        authorId: session.user.id as string
      }
    });
    
    return safeNextResponse({ 
      message: 'Blog post created successfully', 
      post: newPost 
    }, 201);
  } catch (error) {
    console.error('Error creating blog post:', error);
    return safeNextResponse({ error: 'Failed to create blog post' }, 500);
  }
};
