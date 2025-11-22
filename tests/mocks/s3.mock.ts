import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

export const s3 = {
  client: new S3Client({ region: 'us-east-2' }),
  mock: null as any,
};

s3.mock = mockClient(S3Client);

export const mockS3Objects = [
  {
    key: 'patients/patient-123/medical-records/lab-results-2024-01.pdf',
    bucket: process.env.S3_BUCKET || 'smartcare-medical-files',
    contentType: 'application/pdf',
    size: 1024 * 500, // 500KB
    uploadDate: new Date().toISOString(),
  },
  {
    key: 'patients/patient-123/prescriptions/prescription-2024-01.pdf',
    bucket: process.env.S3_BUCKET || 'smartcare-medical-files',
    contentType: 'application/pdf',
    size: 1024 * 200, // 200KB
    uploadDate: new Date().toISOString(),
  },
];

export async function setupS3Mock() {
  s3.mock.on(GetObjectCommand).callsFake(async (input) => {
    const { Key } = input;
    const obj = mockS3Objects.find(o => o.key === Key);
    
    if (!obj) {
      throw new Error('NoSuchKey');
    }
    
    return {
      Body: {
        transformToString: async () => 'mock file content',
      },
      ContentType: obj.contentType,
      ContentLength: obj.size,
      LastModified: new Date(obj.uploadDate),
      Metadata: {
        'patient-id': 'patient-123',
      },
      $metadata: { httpStatusCode: 200 },
    };
  });

  s3.mock.on(PutObjectCommand).callsFake(async (input) => {
    return {
      ETag: '"mock-etag-123"',
      VersionId: 'v1',
      $metadata: { httpStatusCode: 200 },
    };
  });

  s3.mock.on(DeleteObjectCommand).resolves({
    DeleteMarker: true,
    VersionId: 'v1',
  });
}

export function cleanupS3Mock() {
  s3.mock.restore();
}
