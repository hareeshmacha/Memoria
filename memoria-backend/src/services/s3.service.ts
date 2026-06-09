import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const bucketName = process.env.S3_BUCKET_NAME || 'antigravity-media';

export class S3Service {
  /**
   * Generates a presigned upload URL for the frontend to upload media directly to S3.
   */
  static async generatePresignedUploadUrl(
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ uploadUrl: string; key: string }> {
    const extension = contentType.split('/')[1] || 'bin';
    const key = `${folder}/${uuidv4()}.${extension}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });
    
    // URL expires in 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    return { uploadUrl, key };
  }

  static async generatePresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    // URL expires in 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static getPublicUrl(key: string): string {
    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
}
