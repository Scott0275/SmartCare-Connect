const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ Environment variables loaded from .env.local');
    return true;
  } else {
    console.log('❌ .env.local file not found');
    return false;
  }
}

function testS3Configuration() {
  console.log('🧪 Testing S3 Storage Configuration...\n');

  // Load environment variables
  loadEnvFile();

  // Check S3-related variables
  const s3Config = {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
    cloudfront: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
    identityPool: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    useAWS: process.env.NEXT_PUBLIC_USE_AWS
  };

  console.log('📋 S3 Configuration:');
  Object.entries(s3Config).forEach(([key, value]) => {
    const status = value && value !== 'undefined' ? '✅' : '❌';
    const displayValue = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'Not set';
    console.log(`   ${status} ${key}: ${displayValue}`);
  });

  // Test file organization
  console.log('\n📁 Testing Medical File Organization:');
  const testPaths = [
    'medical-files/patients/patient-123/images/xray/chest-scan.jpg',
    'medical-files/patients/patient-456/documents/lab-result/blood-test.pdf',
    'medical-files/patients/patient-789/images/mri/brain-scan.dcm'
  ];

  testPaths.forEach((testPath, index) => {
    console.log(`   ${index + 1}. ${testPath}`);
  });

  // Generate sample URLs
  if (s3Config.bucket) {
    console.log('\n🌐 Sample S3 URLs:');
    const sampleKey = 'medical-files/patients/test-123/images/xray/sample.jpg';
    
    if (s3Config.cloudfront) {
      console.log(`   CloudFront: https://${s3Config.cloudfront}/${sampleKey}`);
    }
    
    if (s3Config.region) {
      console.log(`   Direct S3: https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${sampleKey}`);
    }
  }

  // Check if ready for testing
  const requiredVars = ['region', 'bucket', 'useAWS'];
  const configured = requiredVars.filter(key => s3Config[key] && s3Config[key] !== 'undefined').length;
  
  console.log(`\n📊 Configuration Status: ${configured}/${requiredVars.length} required variables set`);
  
  if (configured === requiredVars.length) {
    console.log('✅ S3 storage is configured and ready for testing');
    
    if (s3Config.useAWS === 'true') {
      console.log('\n🚀 Next Steps:');
      console.log('   1. Ensure AWS credentials are configured');
      console.log('   2. Deploy S3 bucket via Terraform');
      console.log('   3. Run: npm run test:s3');
    } else {
      console.log('\n💡 AWS is disabled. To enable S3 storage:');
      console.log('   Set NEXT_PUBLIC_USE_AWS=true in .env.local');
    }
    
    return true;
  } else {
    console.log('❌ S3 storage configuration incomplete');
    console.log('\n💡 Required environment variables:');
    console.log('   NEXT_PUBLIC_AWS_REGION=us-east-1');
    console.log('   NEXT_PUBLIC_S3_BUCKET=your-bucket-name');
    console.log('   NEXT_PUBLIC_USE_AWS=true');
    
    return false;
  }
}

// Test storage migration readiness
function testMigrationReadiness() {
  console.log('\n🔄 Testing Storage Migration Readiness...\n');

  const migrationScript = path.join(process.cwd(), 'scripts', 'migrate-storage-to-s3.js');
  
  if (fs.existsSync(migrationScript)) {
    console.log('✅ Migration script exists');
    
    const content = fs.readFileSync(migrationScript, 'utf8');
    const hasFirebaseAdmin = content.includes('firebase-admin');
    const hasS3Client = content.includes('@aws-sdk/client-s3');
    
    console.log(`   ${hasFirebaseAdmin ? '✅' : '❌'} Firebase Admin SDK integration`);
    console.log(`   ${hasS3Client ? '✅' : '❌'} AWS S3 SDK integration`);
    
    if (hasFirebaseAdmin && hasS3Client) {
      console.log('✅ Migration script is ready');
      console.log('\n💡 To run migration:');
      console.log('   1. Set AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
      console.log('   2. Ensure Firebase service account is configured');
      console.log('   3. Run: npm run migrate:storage');
      return true;
    } else {
      console.log('❌ Migration script needs dependencies');
      return false;
    }
  } else {
    console.log('❌ Migration script not found');
    return false;
  }
}

// Run all tests
const configOk = testS3Configuration();
const migrationOk = testMigrationReadiness();

if (configOk && migrationOk) {
  console.log('\n🎉 S3 Storage and Migration are ready!');
  process.exit(0);
} else {
  console.log('\n⚠️  S3 Storage setup needs configuration.');
  process.exit(1);
}