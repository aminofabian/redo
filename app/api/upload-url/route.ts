import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    const { filename, contentType } = await request.json();
    
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and content type are required' },
        { status: 400 }
      );
    }

    const key = `products/${filename}`;
    
    // Create the command to put an object in the S3 bucket
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });
    
    // Generate a presigned URL for the command
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Generate the URL to access the file after upload
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    
    return NextResponse.json({ url, fileUrl });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
} 