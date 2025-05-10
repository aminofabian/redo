import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the user has purchased this product
    const purchase = await db.purchase.findFirst({
      where: {
        userId: session.user.id,
        productId: params.productId,
        status: "COMPLETED",
      },
      include: {
        product: true,
      }
    });

    if (!purchase) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Log the download
    await db.download.create({
      data: {
        userId: session.user.id,
        productId: params.productId,
        purchaseId: purchase.id,
      }
    });

    // Get the secure URL for the file (implement based on your storage solution)
    const downloadUrl = await getSecureDownloadUrl(purchase.product.downloadUrl);

    // Return the secure download URL
    return NextResponse.json({ url: downloadUrl });

  } catch (error) {
    console.error("[DOWNLOAD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Helper function to generate secure download URLs
async function getSecureDownloadUrl(storagePath: string) {
  // Implement based on your storage solution (S3, GCS, etc.)
  // Example for S3:
  // const s3 = new AWS.S3();
  // const url = await s3.getSignedUrlPromise('getObject', {
  //   Bucket: process.env.AWS_BUCKET_NAME,
  //   Key: storagePath,
  //   Expires: 60 * 5 // URL expires in 5 minutes
  // });
  // return url;
  
  return storagePath; // Placeholder
} 