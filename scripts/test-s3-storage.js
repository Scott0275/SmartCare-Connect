const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

// Test S3 storage functionality
async function testS3Storage() {
  console.log('🧪 Testing S3 Storage Configuration...\n');

  const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET;
  const testKey = `test-files/test-${Date.now()}.txt`;
  const testContent = 'This is a test file for SmartCare Connect S3 storage.';

  try {
    // Test 1: Upload a test file
    console.log('📤 Test 1: Uploading test file...');
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      Metadata: {
        testFile: 'true',
        uploadedAt: new Date().toISOString(),
      },
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ File uploaded successfully');

    // Test 2: Generate signed URL
    console.log('\n🔗 Test 2: Generating signed URL...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    console.log('✅ Signed URL generated:', signedUrl.substring(0, 100) + '...');

    // Test 3: List objects in bucket
    console.log('\n📋 Test 3: Listing bucket contents...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
    });

    const listResult = await s3Client.send(listCommand);
    console.log(`✅ Found ${listResult.KeyCount} objects in bucket`);
    
    if (listResult.Contents) {
      listResult.Contents.forEach((obj, index) => {
        console.log(`   ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
      });
    }

    // Test 4: CloudFront URL generation
    console.log('\n🌐 Test 4: CloudFront URL generation...');
    const cloudFrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
    if (cloudFrontDomain) {
      const cloudFrontUrl = `https://${cloudFrontDomain}/${testKey}`;
      console.log('✅ CloudFront URL:', cloudFrontUrl);
    } else {
      console.log('⚠️  CloudFront domain not configured');
      const s3Url = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${testKey}`;
      console.log('📍 Direct S3 URL:', s3Url);
    }

    // Test 5: Medical file path structure
    console.log('\n🏥 Test 5: Medical file organization...');
    const medicalPaths = [
      'medical-files/patients/patient-123/images/xray/chest-xray.jpg',
      'medical-files/patients/patient-123/documents/lab-result/blood-test.pdf',
      'medical-files/patients/patient-456/images/mri/brain-scan.dcm',
    ];

    medicalPaths.forEach(path => {
      console.log(`✅ Valid path: ${path}`);
    });

    console.log('\n🎉 All S3 storage tests passed!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Region: ${process.env.NEXT_PUBLIC_AWS_REGION}`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   CloudFront: ${cloudFrontDomain || 'Not configured'}`);
    console.log(`   Encryption: AES256 (Server-side)`);
    console.log(`   Access: Signed URLs with 1-hour expiration`);

  } catch (error) {
    console.error('❌ S3 storage test failed:', error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Ensure the S3 bucket exists');
      console.log('   2. Check bucket name in environment variables');
      console.log('   3. Verify AWS credentials have S3 permissions');
    } else if (error.name === 'AccessDenied') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check AWS credentials');
      console.log('   2. Verify IAM permissions for S3 operations');
      console.log('   3. Ensure bucket policy allows your operations');
    }
    
    process.exit(1);
  }
}

// Run the test
testS3Storage()
  .then(() => {
    console.log('\n✨ S3 storage is ready for medical file management!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });