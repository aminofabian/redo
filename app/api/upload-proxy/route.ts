import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getRandomValues } from 'crypto';

// Helper to generate a unique ID
function generateId(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const values = new Uint8Array(length);
  getRandomValues(values);
  return Array.from(values)
    .map(x => charset[x % charset.length])
    .join('');
}

// Configure the route to handle larger files
export const maxDuration = 60; // Extends the timeout to 60 seconds
export const fetchCache = 'force-no-store'; // Prevents caching of results
export const revalidate = 0; // Prevents revalidation
export const runtime = 'nodejs'; // Uses Node.js runtime for S3 SDK compatibility

export async function POST(request: NextRequest) {
  try {
    // Check if AWS config is present
    const region = process.env.AWS_REGION;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!region || !bucketName || !accessKeyId || !secretAccessKey) {
      console.error('AWS Configuration:', {
        region,
        bucketName,
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey
      });
      return NextResponse.json({ error: 'AWS configuration missing' }, { status: 500 });
    }
    
    // Parse the FormData from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Create a unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${generateId(6)}.${fileExtension}`;
    const key = `products/${uniqueFileName}`;
    
    // Convert File to Buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Initialize S3 client
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    // Create the command to put an object in the S3 bucket
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
    });
    
    // Upload to S3
    await s3Client.send(command);
    
    // Generate the URL to access the file
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    
    console.log('Successfully uploaded to S3:', fileUrl);
    
    return NextResponse.json({ 
      success: true,
      fileUrl 
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 