import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

// GET a specific blog post
export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const id = params.id;
    
    const blogPost = await db.blogPost.findUnique({
      where: { id },
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
    
    if (!blogPost) {
      return safeNextResponse({ error: 'Blog post not found' }, 404);
    }
    
    return safeNextResponse({ blogPost });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return safeNextResponse({ error: 'Failed to fetch blog post' }, 500);
  }
};

// PUT (update) a blog post
export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return safeNextResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = params.id;
    const body = await request.json();
    const { title, slug, content, imageUrl, published, category } = body;
    
    if (!title || !slug || !content) {
      return safeNextResponse({ error: 'Missing required fields' }, 400);
    }
    
    // Check if the post exists
    const existingPost = await db.blogPost.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return safeNextResponse({ error: 'Blog post not found' }, 404);
    }
    
    // Check if the user is the author or an admin
    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return safeNextResponse({ error: 'Not authorized to update this post' }, 403);
    }
    
    // Check if slug already exists on another post
    if (slug !== existingPost.slug) {
      const slugExists = await db.blogPost.findFirst({
        where: {
          slug,
          NOT: {
            id
          }
        }
      });
      
      if (slugExists) {
        return safeNextResponse({ error: 'Slug already exists' }, 400);
      }
    }
    
    const updatedPost = await db.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        imageUrl,
        published,
        category,
        updatedAt: new Date()
      }
    });
    
    return safeNextResponse({ 
      message: 'Blog post updated successfully', 
      post: updatedPost 
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return safeNextResponse({ error: 'Failed to update blog post' }, 500);
  }
};

// DELETE a blog post
export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return safeNextResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = params.id;
    
    // Check if the post exists
    const existingPost = await db.blogPost.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return safeNextResponse({ error: 'Blog post not found' }, 404);
    }
    
    // Check if the user is the author or an admin
    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return safeNextResponse({ error: 'Not authorized to delete this post' }, 403);
    }
    
    await db.blogPost.delete({
      where: { id }
    });
    
    return safeNextResponse({ 
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return safeNextResponse({ error: 'Failed to delete blog post' }, 500);
  }
};
