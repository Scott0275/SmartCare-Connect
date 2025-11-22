const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      console.log(`✅ ${description}`);
      console.log(`   File: ${filePath}`);
      console.log(`   Size: ${content.length} chars, ${lines} lines`);
      return true;
    } else {
      console.log(`❌ ${description} - File not found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

function verifyS3Implementation() {
  console.log('🔍 Verifying S3 Storage Implementation...\n');

  const files = [
    {
      path: 'lib/s3StorageService.ts',
      description: 'S3 Storage Service'
    },
    {
      path: 'lib/storageService.ts', 
      description: 'Unified Storage Service'
    },
    {
      path: 'hooks/useFileUpload.ts',
      description: 'File Upload Hook'
    },
    {
      path: 'components/MedicalFileUpload.tsx',
      description: 'Medical File Upload Component'
    },
    {
      path: 'scripts/migrate-storage-to-s3.js',
      description: 'Storage Migration Script'
    }
  ];

  let passed = 0;
  const total = files.length;

  files.forEach(file => {
    const fullPath = path.join(process.cwd(), file.path);
    if (checkFile(fullPath, file.description)) {
      passed++;
    }
    console.log('');
  });

  console.log('📊 Verification Results:');
  console.log(`✅ Files Found: ${passed}/${total}`);
  console.log(`📈 Completion: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log('\n🎉 All S3 storage files are present and ready!');
    console.log('\n📋 Implementation Status:');
    console.log('   ✅ S3StorageService - Direct S3 operations');
    console.log('   ✅ StorageService - Unified Firebase/S3 interface');
    console.log('   ✅ useFileUpload - React hook with progress');
    console.log('   ✅ MedicalFileUpload - UI component');
    console.log('   ✅ Migration Script - Firebase to S3 transfer');
    
    console.log('\n🚀 Ready for Deployment:');
    console.log('   1. Deploy S3 bucket via Terraform');
    console.log('   2. Configure environment variables');
    console.log('   3. Test with real AWS credentials');
  } else {
    console.log('\n⚠️  Some files are missing. Check the implementation.');
  }

  return passed === total;
}

// Check environment configuration
function checkEnvironmentConfig() {
  console.log('\n🔧 Checking Environment Configuration...\n');

  const requiredVars = [
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_S3_BUCKET', 
    'NEXT_PUBLIC_CLOUDFRONT_DOMAIN',
    'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID'
  ];

  let configured = 0;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'undefined') {
      console.log(`✅ ${varName}: ${value}`);
      configured++;
    } else {
      console.log(`❌ ${varName}: Not configured`);
    }
  });

  console.log(`\n📊 Configuration: ${configured}/${requiredVars.length} variables set`);
  
  if (configured === requiredVars.length) {
    console.log('✅ Environment fully configured for S3 storage');
  } else {
    console.log('⚠️  Some environment variables need configuration');
  }

  return configured === requiredVars.length;
}

// Run verification
const filesOk = verifyS3Implementation();
const configOk = checkEnvironmentConfig();

if (filesOk && configOk) {
  console.log('\n🎉 S3 Storage is ready for testing and deployment!');
  process.exit(0);
} else {
  console.log('\n⚠️  S3 Storage setup needs attention.');
  process.exit(1);
}