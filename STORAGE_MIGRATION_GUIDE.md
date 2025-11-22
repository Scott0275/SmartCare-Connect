# Storage Migration Guide: Firebase Storage → AWS S3

## 🎯 Migration Overview

This guide covers migrating from Firebase Storage to AWS S3 with CloudFront CDN for the SmartCare Connect healthcare management system.

## 🏗️ Architecture Changes

### Before (Firebase Storage)
```
Client → Firebase Storage → Direct File URLs
```

### After (AWS S3 + CloudFront)
```
Client → S3 (via Cognito Auth) → CloudFront CDN → Secure File URLs
```

## 📋 Prerequisites

1. **AWS Infrastructure**: Ensure Terraform has deployed:
   - S3 bucket with encryption
   - CloudFront distribution
   - Cognito Identity Pool
   - IAM roles and policies

2. **Environment Variables**: Update `.env.local`:
   ```env
   NEXT_PUBLIC_USE_AWS=true
   NEXT_PUBLIC_S3_BUCKET=smartcare-connect-dev-medical-files
   NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
   NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-2:12345678-1234-1234-1234-123456789012
   ```

## 🚀 Migration Steps

### Step 1: Install Dependencies
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/credential-providers
```

### Step 2: Test S3 Configuration
```bash
npm run test:s3
```

### Step 3: Migrate Existing Files (Optional)
```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# Run migration
npm run migrate:storage
```

### Step 4: Update Application Code

#### Replace Firebase Storage imports:
```typescript
// OLD: Firebase Storage
import { storage } from './lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// NEW: Unified Storage Service
import { StorageService } from './lib/storageService';
```

#### Update file upload code:
```typescript
// OLD: Firebase Upload
const storageRef = ref(storage, `files/${fileName}`);
const snapshot = await uploadBytes(storageRef, file);
const url = await getDownloadURL(snapshot.ref);

// NEW: Unified Upload
const result = await StorageService.uploadFile(file, 'files', metadata);
const url = result.url;
```

### Step 5: Use Medical File Components
```tsx
import MedicalFileUpload from '../components/MedicalFileUpload';

// Medical Image Upload
<MedicalFileUpload
  patientId="patient-123"
  type="image"
  category="xray"
  onUploadComplete={(result) => console.log('Uploaded:', result)}
/>

// Medical Document Upload
<MedicalFileUpload
  patientId="patient-123"
  type="document"
  documentType="lab-result"
  onUploadComplete={(result) => console.log('Uploaded:', result)}
/>
```

## 🔐 Security Features

### 1. **Encryption**
- **At Rest**: AES-256 server-side encryption
- **In Transit**: TLS 1.2+ for all communications
- **Client-side**: Optional encryption for sensitive data

### 2. **Access Control**
- **Cognito Authentication**: User must be authenticated
- **Signed URLs**: Time-limited access (1 hour default)
- **IAM Policies**: Least privilege access

### 3. **HIPAA Compliance**
- **Audit Trail**: CloudTrail logs all S3 operations
- **Data Residency**: Files stay in specified AWS region
- **Access Logging**: CloudFront access logs
- **Encryption**: End-to-end encryption

## 📁 File Organization

### Medical Files Structure
```
medical-files/
├── patients/
│   ├── {patientId}/
│   │   ├── images/
│   │   │   ├── xray/
│   │   │   ├── mri/
│   │   │   ├── ct/
│   │   │   ├── ultrasound/
│   │   │   └── photo/
│   │   └── documents/
│   │       ├── lab-result/
│   │       ├── prescription/
│   │       ├── report/
│   │       ├── consent/
│   │       └── insurance/
└── migrated/
    └── {original-firebase-paths}
```

## 🌐 CloudFront Configuration

### Cache Behavior
- **Medical Files**: 5-minute cache (frequent updates)
- **Static Assets**: 1-hour cache
- **Security Headers**: HSTS, X-Frame-Options, etc.

### Geographic Distribution
- **Price Class**: US, Canada, Europe (cost-optimized)
- **HTTPS Only**: Redirect HTTP to HTTPS
- **Compression**: Enabled for supported file types

## 🧪 Testing

### 1. **Unit Tests**
```bash
npm run test:s3
```

### 2. **Integration Tests**
```typescript
import { StorageService } from './lib/storageService';

// Test file upload
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
const result = await StorageService.uploadFile(file, 'test');
console.log('Upload result:', result);

// Test file download
const url = await StorageService.getDownloadUrl(result.key);
console.log('Download URL:', url);
```

### 3. **Medical File Tests**
```typescript
// Test medical image upload
const xrayFile = new File([imageData], 'chest-xray.jpg', { type: 'image/jpeg' });
const result = await StorageService.uploadMedicalImage(xrayFile, 'patient-123', 'xray');

// Test medical document upload
const labResult = new File([pdfData], 'blood-test.pdf', { type: 'application/pdf' });
const result = await StorageService.uploadMedicalDocument(labResult, 'patient-123', 'lab-result');
```

## 📊 Performance Optimization

### 1. **File Size Limits**
- **Images**: 10MB max
- **Documents**: 25MB max
- **Validation**: Client-side and server-side

### 2. **Compression**
- **Images**: WebP format when possible
- **Documents**: PDF compression
- **CloudFront**: Automatic gzip compression

### 3. **Caching Strategy**
- **Signed URLs**: Cache for 1 hour
- **Public Assets**: Cache for 24 hours
- **Medical Files**: Cache for 5 minutes

## 🚨 Troubleshooting

### Common Issues

#### 1. **Access Denied Errors**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify S3 permissions
aws s3 ls s3://your-bucket-name
```

#### 2. **CORS Issues**
Update S3 bucket CORS configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### 3. **CloudFront Cache Issues**
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Monitoring

#### 1. **CloudWatch Metrics**
- S3 request metrics
- CloudFront cache hit ratio
- Error rates

#### 2. **Cost Monitoring**
- S3 storage costs
- CloudFront data transfer
- Request charges

## 🔄 Rollback Plan

If issues occur, you can rollback by:

1. **Switch back to Firebase**:
   ```env
   NEXT_PUBLIC_USE_AWS=false
   ```

2. **Keep both systems running** during transition period

3. **Gradual migration** using feature flags

## ✅ Migration Checklist

- [ ] AWS infrastructure deployed via Terraform
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] S3 storage tested
- [ ] File upload components updated
- [ ] Medical file organization implemented
- [ ] Security headers configured
- [ ] CloudFront distribution tested
- [ ] Migration script tested (if needed)
- [ ] Monitoring and alerts set up
- [ ] Documentation updated
- [ ] Team training completed

## 📞 Support

For issues during migration:
1. Check CloudWatch logs
2. Verify IAM permissions
3. Test with AWS CLI
4. Review Terraform outputs
5. Contact AWS support if needed

---

**Next Steps**: After completing storage migration, proceed to [Phase 5: Functions Migration](./PHASE5_FUNCTIONS_MIGRATION.md)