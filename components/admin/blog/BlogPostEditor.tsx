"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Heading1, 
  Heading2, 
  Heading3, 
  ImageIcon,
  ListOrdered,
  List,
  Quote,
  Undo,
  Redo,
  Save,
  FileImage,
  Loader2,
  Upload,
  X,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogPostData {
  id?: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  content: string;
  imageUrl?: string;
  imageFile?: File;  // For handling file uploads before saving
  published: boolean;
}

export default function BlogPostEditor({ existingPost }: { existingPost?: BlogPostData }) {
  const router = useRouter();
  const [postData, setPostData] = useState<BlogPostData>(() => {
    if (existingPost) {
      return { ...existingPost };
    }
    return {
      title: "",
      slug: "",
      content: "",
      imageUrl: "",
      imageFile: undefined,
      published: false
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isInsertingImage, setIsInsertingImage] = useState(false);

  // Create a ref for the hidden file input
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable the default heading from StarterKit
      }),
      Underline,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
    ],
    content: postData.content || "",
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
      handlePaste: (view, event: ClipboardEvent) => {
        // Handle pasted images
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;
        
        const items = Array.from(clipboardData.items);
        const { state } = view;
        let handled = false;
        
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                if (!readerEvent.target?.result) return;
                
                const node = state.schema.nodes.image.create({
                  src: readerEvent.target.result,
                  alt: 'Pasted image',
                  title: 'Pasted image'
                });
                const transaction = state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              };
              reader.onerror = (error) => {
                console.error('Error reading pasted image:', error);
              };
              reader.readAsDataURL(file);
              handled = true;
            }
          }
        }
        return handled;
      },
      handleDrop: (view, event: DragEvent) => {
        // Handle dropped images
        const dataTransfer = event.dataTransfer;
        if (!dataTransfer || !dataTransfer.files || dataTransfer.files.length === 0) {
          return false;
        }
        
        const images = Array.from(dataTransfer.files).filter(
          (file): file is File => file.type.startsWith('image/')
        );
        
        if (images.length === 0) return false;
        
        event.preventDefault();
        
        const { schema } = view.state;
        const coordinates = view.posAtCoords({ 
          left: event.clientX, 
          top: event.clientY 
        }) || { pos: 0 };
        
        images.forEach((image) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            if (!readerEvent.target?.result) return;
            
            const node = schema.nodes.image.create({
              src: readerEvent.target.result,
              alt: image.name,
              title: image.name,
            });
            const transaction = view.state.tr.insert(coordinates.pos, node);
            view.dispatch(transaction);
          };
          reader.onerror = (error) => {
            console.error('Error reading dropped file:', error);
          };
          reader.readAsDataURL(image);
        });
        
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      // Get HTML with proper formatting - ensures headings, lists, etc. are properly formatted
      const content = editor.getHTML();
      setPostData(prev => ({ ...prev, content }));
    },
  });

  // Generate slug from title
  useEffect(() => {
    if (postData.title && !existingPost) {
      const slug = postData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      setPostData(prev => ({ ...prev, slug }));
    }
  }, [postData.title, existingPost]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // In production, this would be an API call
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // const response = await fetch("/api/blog", {
      //   method: existingPost ? "PUT" : "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(postData)
      // });
      
      // if (!response.ok) {
      //   throw new Error("Failed to save blog post");
      // }
      
      router.push("/admin/content/blog");
    } catch (error) {
      console.error("Error saving blog post:", error);
      // Show error notification
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to convert blob URL to data URL
  const blobToDataURL = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting blob to data URL:', error);
      return blobUrl; // Return original if conversion fails
    }
  };

  // Simple image preview handler - no upload, just local preview
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      // Create a data URL for the image instead of object URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      setPostData(prev => ({
        ...prev,
        imageUrl: dataUrl,
        imageFile: file
      }));
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };
  
  // Function to trigger image upload with size options
  const triggerImageUpload = () => {
    console.log('Image button clicked');
    console.log('Editor exists:', !!editor);
    console.log('Input ref exists:', !!inlineImageInputRef.current);
    
    // Ask user for image placement preference
    const placement = window.confirm(
      'Click OK for inline image (small, within text) or Cancel for block image (full width, on its own line)'
    );
    
    // Store the preference for use in the file handler
    if (inlineImageInputRef.current) {
      inlineImageInputRef.current.dataset.placement = placement ? 'inline' : 'block';
    }
    
    inlineImageInputRef.current?.click();
  };

  // Handle inline image upload from file input
  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    const files = e.target.files;
    console.log('Files selected:', files?.length || 0);
    console.log('Files array:', files);
    
    if (!files || files.length === 0) return;
    
    // Store files in a separate array before resetting the input
    const fileArray = Array.from(files);
    console.log('File array created:', fileArray.length);
    
    // Set loading state
    setIsInsertingImage(true);
    
    // Get the placement preference
    const placement = e.target.dataset.placement || 'block';
    console.log('Image placement:', placement);
    
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
    
    if (!editor) {
      console.error('Editor not available');
      setIsInsertingImage(false);
      return;
    }
    
    console.log('Processing files...');
    console.log('About to start for loop, fileArray.length:', fileArray.length);
    
    let processedFiles = 0;
    const totalFiles = fileArray.length;
    
    // Process each selected file
    for (let i = 0; i < fileArray.length; i++) {
      console.log('Loop iteration:', i);
      const file = fileArray[i];
      console.log('File object:', file);
      
      if (!file) {
        console.error('File is null or undefined at index:', i);
        processedFiles++;
        if (processedFiles === totalFiles) {
          setIsInsertingImage(false);
        }
        continue;
      }
      
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        console.error('File is not an image:', file.name);
        alert(`File "${file.name}" is not an image.`);
        processedFiles++;
        if (processedFiles === totalFiles) {
          setIsInsertingImage(false);
        }
        continue;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.name);
        alert(`Image "${file.name}" is too large. Maximum size is 5MB.`);
        processedFiles++;
        if (processedFiles === totalFiles) {
          setIsInsertingImage(false);
        }
        continue;
      }
      
      console.log('File passed validation, reading...');
      
      // Read the file as a data URL
      const reader = new FileReader();
      
      reader.onload = (readerEvent) => {
        console.log('File read successfully for:', file.name);
        
        if (!editor) {
          console.error('Editor not available when trying to insert image');
          processedFiles++;
          if (processedFiles === totalFiles) {
            setIsInsertingImage(false);
          }
          return;
        }
        
        if (!readerEvent.target?.result) {
          console.error('No result from file reader');
          processedFiles++;
          if (processedFiles === totalFiles) {
            setIsInsertingImage(false);
          }
          return;
        }
        
        console.log('Inserting image into editor...');
        console.log('Editor state:', editor.state);
        console.log('Can insert image:', editor.can().setImage({
          src: 'test',
          alt: 'test'
        }));
        
        try {
          // Try multiple approaches to insert the image
          let result = false;
          
          // Method 1: Using setImage command (most reliable)
          result = editor.chain()
            .focus()
            .setImage({ 
              src: readerEvent.target.result as string,
              alt: file.name,
              title: file.name
            })
            .run();
            
          console.log('setImage result:', result);
          
          // If setImage failed, try insertContent
          if (!result) {
            console.log('setImage failed, trying insertContent...');
            result = editor.chain()
              .focus()
              .insertContent(`<img src="${readerEvent.target.result}" alt="${file.name}" title="${file.name}" style="${placement === 'inline' ? 'display: inline; max-height: 2rem; width: auto; vertical-align: middle; margin: 0 0.25rem;' : 'display: block; max-width: 100%; height: auto; margin: 0.5rem auto;'}" />`)
              .run();
              
            console.log('insertContent result:', result);
          }
          
          // If both failed, try basic HTML insertion
          if (!result) {
            console.log('Both methods failed, trying basic insertion...');
            
            // Insert simple text first to test
            result = editor.chain()
              .focus()
              .insertContent('🖼️ Image inserted: ' + file.name)
              .run();
              
            console.log('Basic insertion result:', result);
          }
          
          if (!result) {
            console.error('All insertion methods failed');
            alert('Failed to insert image. Please try again.');
          } else {
            console.log('Image inserted successfully!');
          }
        } catch (error) {
          console.error('Error inserting image:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert('Error inserting image: ' + errorMessage);
        }
        
        // Increment processed files count and hide loader if all done
        processedFiles++;
        if (processedFiles === totalFiles) {
          setIsInsertingImage(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', file.name, error);
        processedFiles++;
        if (processedFiles === totalFiles) {
          setIsInsertingImage(false);
        }
      };
      
      console.log('About to call readAsDataURL for:', file.name);
      reader.readAsDataURL(file);
      console.log('readAsDataURL called for:', file.name);
    }
    
    console.log('For loop completed');
  };

  const addLink = () => {
    if (!editor) return;
    
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  // Helper function to convert blob URLs to data URLs in content
  const processImagesInContent = async (content: string): Promise<string> => {
    if (!content) return content;
    
    try {
      // Create a temporary div to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const images = doc.querySelectorAll('img[src^="blob:"]');
      
      // Convert each blob URL to a data URL
      for (const img of Array.from(images)) {
        const src = img.getAttribute('src');
        if (!src) continue;
        
        try {
          const response = await fetch(src);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read blob as data URL'));
            reader.readAsDataURL(blob);
          });
          
          // Replace the blob URL with the data URL
          img.setAttribute('src', dataUrl);
        } catch (error) {
          console.error('Error processing image:', error);
          // Remove the image if we can't process it
          img.remove();
        }
      }
      
      // Return the processed HTML
      return doc.body.innerHTML;
    } catch (error) {
      console.error('Error processing content for images:', error);
      return content; // Return original content if processing fails
    }
  };
  
  const handlePreview = async () => {
    if (!editor) return;
    
    try {
      // Update content from editor
      const content = editor.getHTML();
      setPostData(prev => ({ ...prev, content }));
      
      // Process images in content to ensure they're data URLs
      const processedContent = await processImagesInContent(content);
      
      // Save the current post data to localStorage for the preview page
      const previewData = { 
        ...postData, 
        content: processedContent || content,
        // Ensure we have the latest content
        ...(postData.imageUrl?.startsWith('blob:') ? {
          // If we have a blob URL for the featured image, convert it to a data URL
          imageUrl: await blobToDataURL(postData.imageUrl)
        } : {})
      };
      
      // If we have a file, we need to convert it to a data URL for the preview
      if (postData.imageFile) {
        try {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(postData.imageFile!);
          });
          previewData.imageUrl = dataUrl;
        } catch (error) {
          console.error('Error processing image for preview:', error);
        }
      } else if (postData.imageUrl) {
        // If it's a URL (not a file), use it directly
        previewData.imageUrl = postData.imageUrl;
      }
      
      localStorage.setItem('blogPostPreview', JSON.stringify(previewData));
      
      // Open the preview in a new tab
      window.open('/blog/preview', '_blank');
    } catch (error) {
      console.error('Error preparing preview:', error);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with title and actions */}
      <div className="bg-gradient-to-r from-[#1e2c51] to-[#2a3e6e] p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-semibold">{existingPost ? 'Edit Post' : 'Create New Post'}</h2>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !postData.title}
            size="sm"
            className="bg-white text-[#1e2c51] hover:bg-white/90 gap-1"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-[#1e2c51] border-opacity-50 border-t-[#1e2c51] rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Post
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="p-6 space-y-6">
        {/* Post metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input
                type="text"
                id="title"
                placeholder="Enter post title"
                value={postData.title}
                onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                className="h-11"
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
              <Input
                type="text"
                id="slug"
                placeholder="post-url-slug"
                value={postData.slug}
                onChange={(e) => setPostData({ ...postData, slug: e.target.value })}
                className="h-11"
              />
            </div>
            
            {/* Meta Title - Optional */}
            <div>
              <Label htmlFor="metaTitle" className="text-sm font-medium">Meta Title <span className="text-xs text-gray-500">(Optional)</span></Label>
              <Input
                type="text"
                id="metaTitle"
                placeholder="SEO title - leave empty to use post title"
                value={postData.metaTitle || ''}
                onChange={(e) => setPostData({ ...postData, metaTitle: e.target.value })}
                className="h-11"
              />
            </div>
            
            {/* Meta Description - Optional */}
            <div>
              <Label htmlFor="metaDescription" className="text-sm font-medium">Meta Description <span className="text-xs text-gray-500">(Optional)</span></Label>
              <textarea
                id="metaDescription"
                placeholder="Brief description for search engines"
                value={postData.metaDescription || ''}
                onChange={(e) => setPostData({ ...postData, metaDescription: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2c51]/20 focus:border-[#1e2c51] resize-none"
                rows={3}
              />
              {postData.metaDescription && (
                <div className="text-xs text-gray-500 mt-1">
                  {postData.metaDescription.length}/160 characters
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug" className="text-sm font-medium">URL Slug</Label>
            <div className="flex items-center">
              <span className="text-gray-500 bg-gray-100 px-3 h-11 flex items-center border border-r-0 rounded-l-md text-sm">/blog/</span>
              <Input
                id="slug"
                value={postData.slug}
                onChange={(e) => setPostData({ ...postData, slug: e.target.value })}
                placeholder="your-post-slug"
                className="mt-0 rounded-l-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="featuredImage" className="text-sm font-medium">Featured Image</Label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPostData(prev => ({ ...prev, imageUrl: '', imageFile: undefined }));
                    // Reset the file input
                    const input = document.getElementById('image-upload') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="ml-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  className="flex items-center"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {isUploadingImage ? "Uploading..." : "Upload Image"}
                </Button>
                <Input 
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="text-xs text-gray-500 flex-1">
                  JPG, PNG or GIF recommended
                </div>
              </div>
            </div>

            {/* Image Preview - only show if we have an image URL */}
            {postData.imageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 mt-2">
                <img 
                  src={postData.imageUrl} 
                  alt="Featured image" 
                  className="w-full h-auto max-h-[200px] object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white/95"
                  onClick={() => setPostData(prev => ({ ...prev, imageUrl: "" }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Editor toolbar */}
        <div className="border rounded-md shadow-sm overflow-hidden">
          <div className="p-2 border-b bg-gray-50 flex flex-wrap gap-1.5 sticky top-0 z-10">
            <div className="flex items-center gap-1.5 mr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("h-8 px-2", editor.isActive("bold") ? "bg-gray-200" : "")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("h-8 px-2", editor.isActive("italic") ? "bg-gray-200" : "")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn("h-8 px-2", editor.isActive("underline") ? "bg-gray-200" : "")}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-6 border-l mx-0.5"></div>
            
            <div className="flex items-center gap-1.5 mr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn("h-8 px-2", editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : "")}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn("h-8 px-2", editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : "")}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn("h-8 px-2", editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : "")}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-6 border-l mx-0.5"></div>
            
            <div className="flex items-center gap-1.5 mr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={cn("h-8 px-2", editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : "")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={cn("h-8 px-2", editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : "")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={cn("h-8 px-2", editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : "")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-6 border-l mx-0.5"></div>
            
            <div className="flex items-center gap-1.5 mr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn("h-8 px-2", editor.isActive("bulletList") ? "bg-gray-200" : "")}
              >
                <List className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn("h-8 px-2", editor.isActive("orderedList") ? "bg-gray-200" : "")}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn("h-8 px-2", editor.isActive("blockquote") ? "bg-gray-200" : "")}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-6 border-l mx-0.5"></div>
            
            <div className="flex items-center gap-1.5 mr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addLink}
                className={cn("h-8 px-2", editor.isActive("link") ? "bg-gray-200" : "")}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={triggerImageUpload}
                disabled={isInsertingImage}
                className={cn("h-8 px-2 relative", isInsertingImage && "opacity-50")}
                title="Insert image"
              >
                {isInsertingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Loading indicator overlay */}
            {isInsertingImage && (
              <div className="absolute top-full left-0 mt-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium shadow-sm border border-blue-200 whitespace-nowrap z-10">
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing image...
                </div>
              </div>
            )}
            
            {/* Hidden file input for inline images */}
            <input 
              ref={inlineImageInputRef}
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleInlineImageUpload}
              className="hidden" 
            />
            
            <div className="h-6 border-l mx-0.5"></div>
            
            <div className="flex items-center gap-1.5">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 px-2"
              >
                <Undo className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 px-2"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Editor content area */}
          <div className="relative">
            {/* Left margin styling with accent color */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#1e2c51]/30 to-[#1e2c51]/5 rounded-full"></div>
            
            {/* Main editor area with paper-like styling */}
            <div 
              className="px-10 py-8 min-h-[500px] prose prose-sm max-w-none relative" 
              style={{
                background: `
                  linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(30, 44, 81, 0.05) 32px),
                  linear-gradient(to right, #f5f7fa 0px, white 1px, white 100%)
                `,
                backgroundSize: '100% 32px',
                backgroundAttachment: 'local',
              }}
            >
              {/* Placeholder text when empty */}
              {!postData.content && (
                <div className="absolute pointer-events-none text-gray-400 font-light italic">
                  <p>Start typing your blog post here...</p>
                  <p className="mt-2">Use the toolbar above to format your content.</p>
                  <p className="mt-4 text-xs">Pro tip: Press Tab to indent text and create structure</p>
                </div>
              )}
              
              {/* Actual editor content */}
              <style jsx global>{`
                .ProseMirror {
                  outline: none !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                .ProseMirror:focus {
                  outline: none !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                .ProseMirror p {
                  margin: 0;
                  padding: 0;
                  line-height: 32px;
                }
                .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
                  margin-top: 32px;
                  margin-bottom: 16px;
                }
                .ProseMirror .editor-image {
                  max-width: 100%;
                  height: auto;
                  border-radius: 0.375rem;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  margin: 0.5rem 0;
                  display: block;
                }
                .ProseMirror img {
                  max-width: 100% !important;
                  height: auto !important;
                  border-radius: 0.375rem !important;
                  margin: 0.5rem 0 !important;
                }
              `}</style>
              <EditorContent 
                editor={editor} 
                className="outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus-within:ring-0 focus-within:outline-none focus-within:border-none min-h-[500px]" 
              />
            </div>
            <div className="absolute right-4 bottom-4 text-xs text-gray-400">
              {editor && (
                <div className="flex items-center gap-2">
                  <span>{editor.storage.characterCount.characters()} characters</span>
                  <span>•</span>
                  <span>{editor.storage.characterCount.words()} words</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="published" 
            checked={postData.published}
            onCheckedChange={(checked) => setPostData({ ...postData, published: !!checked })}
          />
          <Label htmlFor="published" className="text-sm font-medium cursor-pointer select-none">
            Publish immediately
          </Label>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/content/blog")}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !postData.title}
            className="bg-[#1e2c51] hover:bg-[#1e2c51]/90 gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
