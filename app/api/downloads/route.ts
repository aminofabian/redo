import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch user's purchased materials
    const downloads = await db.purchase.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED", // Only show completed purchases
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            downloadUrl: true, // Google Drive URL
            images: {
              where: {
                isPrimary: true
              },
              take: 1,
              select: {
                url: true
              }
            }
          }
        }
      }
    });

    // Transform the data for the client
    const downloadableItems = downloads.map(purchase => ({
      id: purchase.product.id,
      title: purchase.product.title,
      type: getFileType(purchase.product.downloadUrl || ''), // Derive type from URL
      size: 'Available on Drive', // Since size is stored on Drive
      driveUrl: purchase.product.downloadUrl || '#',
      image: purchase.product.images[0]?.url
    }));

    return NextResponse.json(downloadableItems);
    
  } catch (error) {
    console.error("[DOWNLOADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Helper function to determine file type from URL or extension
function getFileType(url: string): string {
  if (!url) return 'Unknown';
  
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'xls':
    case 'xlsx':
      return 'Excel Spreadsheet';
    case 'ppt':
    case 'pptx':
      return 'PowerPoint';
    case 'mp4':
    case 'mov':
      return 'Video';
    case 'mp3':
    case 'wav':
      return 'Audio';
    default:
      return 'Document';
  }
} 