import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch user's purchased materials with more details
    const purchases = await db.purchase.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            description: true,
            downloadUrl: true,
            images: {
              where: {
                isPrimary: true
              },
              take: 1,
              select: {
                url: true
              }
            },
            categories: {
              include: {
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform the data for the client
    const materials = purchases.map(purchase => ({
      id: purchase.product.id,
      title: purchase.product.title,
      description: purchase.product.description || '',
      type: getFileType(purchase.product.downloadUrl || ''),
      progress: Math.floor(Math.random() * 100), // Replace with actual progress tracking
      status: getStatus(Math.floor(Math.random() * 100)), // Replace with actual status tracking
      lastAccessed: purchase.updatedAt.toISOString(),
      thumbnailUrl: purchase.product.images[0]?.url || '/placeholder-image.jpg',
      driveUrl: purchase.product.downloadUrl || '#',
      category: purchase.product.categories[0]?.category.name || 'Uncategorized'
    }));

    return NextResponse.json(materials);
    
  } catch (error) {
    console.error("[MATERIALS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

function getStatus(progress: number): 'not_started' | 'in_progress' | 'completed' {
  if (progress === 0) return 'not_started';
  if (progress === 100) return 'completed';
  return 'in_progress';
} 