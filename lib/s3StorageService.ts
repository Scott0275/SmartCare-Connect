import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: process.env.NEXT_PUBLIC_AWS_REGION! },
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID!,
  }),
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET!;
const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export class S3StorageService {
  /**
   * Upload file to S3 with medical file organization
   */
  static async uploadFile(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const key = `medical-files/${path}/${Date.now()}-${file.name}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);

    const url = CLOUDFRONT_DOMAIN 
      ? `https://${CLOUDFRONT_DOMAIN}/${key}`
      : `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;

    return {
      key,
      url,
      size: file.size,
    };
  }

  /**
   * Get signed URL for secure file access
   */
  static async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Check if file exists
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get public URL (via CloudFront if available)
   */
  static getPublicUrl(key: string): string {
    return CLOUDFRONT_DOMAIN 
      ? `https://${CLOUDFRONT_DOMAIN}/${key}`
      : `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Upload medical image with patient organization
   */
  static async uploadMedicalImage(
    file: File,
    patientId: string,
    category: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'photo' | 'document'
  ): Promise<UploadResult> {
    return this.uploadFile(file, `patients/${patientId}/images/${category}`, {
      patientId,
      category,
      fileType: 'medical-image',
    });
  }

  /**
   * Upload medical document
   */
  static async uploadMedicalDocument(
    file: File,
    patientId: string,
    documentType: 'lab-result' | 'prescription' | 'report' | 'consent' | 'insurance'
  ): Promise<UploadResult> {
    return this.uploadFile(file, `patients/${patientId}/documents/${documentType}`, {
      patientId,
      documentType,
      fileType: 'medical-document',
    });
  }
}