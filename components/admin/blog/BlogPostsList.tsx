"use client";

import { useState, useEffect } from "react";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string;
  };
  category?: string;
}

export default function BlogPostsList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  const router = useRouter();

  // Mock data until we implement the actual API
  const mockPosts: BlogPost[] = [
    {
      id: "post1",
      title: "Getting Started with NCLEX-RN Preparation",
      slug: "getting-started-with-nclex-rn-preparation",
      imageUrl: "/images/blog/nclex-preparation.jpg",
      published: true,
      createdAt: "2025-05-20T10:30:00Z",
      updatedAt: "2025-05-20T14:45:00Z",
      author: {
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@example.com"
      },
      category: "NCLEX"
    },
    {
      id: "post2",
      title: "Top 10 Nursing Study Resources for University of Harvard Students",
      slug: "top-10-nursing-study-resources-harvard",
      imageUrl: "/images/blog/nursing-resources.jpg",
      published: true,
      createdAt: "2025-05-15T09:20:00Z",
      updatedAt: "2025-05-18T11:30:00Z",
      author: {
        name: "Michael Brown",
        email: "m.brown@example.com"
      },
      category: "University of Harvard"
    },
    {
      id: "post3",
      title: "Understanding Pharmacology: A Beginner's Guide",
      slug: "understanding-pharmacology-beginners-guide",
      imageUrl: "/images/blog/pharmacology.jpg",
      published: false,
      createdAt: "2025-05-10T15:45:00Z",
      updatedAt: "2025-05-10T15:45:00Z",
      author: {
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@example.com"
      },
      category: "Pharmacology"
    }
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, we would fetch from the API
        // const response = await fetch('/api/blog');
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setPosts(mockPosts);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again.');
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleEdit = (postId: string) => {
    router.push(`/admin/content/blog/edit/${postId}`);
  };

  const handleView = (slug: string) => {
    // Open in a new tab
    window.open(`/blog/${slug}`, '_blank');
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      // In a real implementation, we would call the API
      // await fetch(`/api/blog/${postToDelete}`, {
      //   method: 'DELETE'
      // });
      
      // For now, just remove from local state
      setPosts(posts.filter(post => post.id !== postToDelete));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      // Show error notification
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e2c51]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No blog posts found. Create your first post!
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.category || "Uncategorized"}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={post.published ? "default" : "outline"}
                      className={post.published ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.author.name}</TableCell>
                  <TableCell>{new Date(post.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(post.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleView(post.slug)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDelete(post.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The post will be permanently deleted from the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
