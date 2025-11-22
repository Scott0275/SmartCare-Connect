const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fetch = require('node-fetch');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

// Initialize S3
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = admin.storage().bucket();
const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET;

async function migrateStorageToS3() {
  console.log('Starting Firebase Storage to S3 migration...');
  
  try {
    // List all files in Firebase Storage
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const file of files) {
      try {
        console.log(`Migrating: ${file.name}`);
        
        // Get download URL from Firebase
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        // Download file content
        const response = await fetch(url);
        const buffer = await response.buffer();
        
        // Get file metadata
        const [metadata] = await file.getMetadata();
        
        // Upload to S3 with same path structure
        const s3Key = `migrated/${file.name}`;
        const uploadCommand = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: buffer,
          ContentType: metadata.contentType || 'application/octet-stream',
          Metadata: {
            originalFirebasePath: file.name,
            migratedAt: new Date().toISOString(),
            originalSize: metadata.size?.toString() || '0',
          },
          ServerSideEncryption: 'AES256',
        });

        await s3Client.send(uploadCommand);
        
        console.log(`✅ Migrated: ${file.name} -> ${s3Key}`);
        migrated++;
        
        // Optional: Delete from Firebase after successful migration
        // await file.delete();
        
      } catch (error) {
        console.error(`❌ Failed to migrate ${file.name}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migrated} files`);
    console.log(`❌ Failed migrations: ${failed} files`);
    console.log(`📁 Total processed: ${files.length} files`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateStorageToS3()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });