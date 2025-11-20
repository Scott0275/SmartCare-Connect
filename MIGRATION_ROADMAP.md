# SmartCare Connect - AWS Migration Roadmap

## 🚨 IMMEDIATE FIX: Amplify Environment Variables

### Step 1: Fix Current Deployment (15 minutes)

1. **Go to AWS Amplify Console**:
   - Navigate to your SmartCare Connect app
   - Go to "Environment variables" section

2. **Verify these variables exist and have correct values**:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyDSRj8GJajqK9KBvmCnY3enW_nM_PnHU-g
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = smartcare-connect-bae0d.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID = smartcare-connect-bae0d
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = smartcare-connect-bae0d.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 1092500862245
   NEXT_PUBLIC_FIREBASE_APP_ID = 1:1092500862245:web:720d075f8314b0420016cc
   NEXT_PUBLIC_USE_EMULATOR = false
   ```

3. **Update Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - echo "Checking environment variables..."
           - echo "Firebase API Key: $NEXT_PUBLIC_FIREBASE_API_KEY"
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

4. **Redeploy**: Trigger a new deployment

---

## 🏗️ COMPLETE AWS MIGRATION PLAN

### Phase 1: Infrastructure Setup (Week 1)

#### Day 1-2: AWS Account Setup
- [ ] Ensure AWS CLI configured with proper permissions
- [ ] Set up Terraform backend (S3 + DynamoDB for state)
- [ ] Create AWS Secrets Manager entries for sensitive data

#### Day 3-4: Core Services Deployment
```bash
# Deploy Cognito
cd terraform/modules/cognito
terraform init
terraform plan
terraform apply

# Deploy DynamoDB
cd ../dynamodb
terraform init
terraform plan
terraform apply

# Deploy S3 + CloudFront
cd ../storage
terraform init
terraform plan
terraform apply
```

#### Day 5-7: API Gateway + Lambda Setup
- [ ] Create Lambda functions for each service
- [ ] Set up API Gateway with proper CORS
- [ ] Configure IAM roles and policies
- [ ] Test API endpoints

### Phase 2: Authentication Migration (Week 2)

#### Day 1-3: Cognito Setup
- [ ] Create user pools with custom attributes
- [ ] Set up role-based access control
- [ ] Configure MFA and security policies

#### Day 4-5: Code Migration
- [ ] Replace Firebase Auth with AWS Amplify Auth
- [ ] Update AuthContext.tsx
- [ ] Test login/logout flows
- [ ] Migrate user roles and permissions

#### Day 6-7: User Data Migration
```javascript
// Migration script example
const migrateUsers = async () => {
  const firebaseUsers = await admin.auth().listUsers();
  
  for (const user of firebaseUsers.users) {
    await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: user.email,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'custom:role', Value: user.customClaims?.role || 'patient' }
      ],
      MessageAction: 'SUPPRESS'
    }).promise();
  }
};
```

### Phase 3: Database Migration (Week 3-4)

#### Week 3: Schema Design & Setup
- [ ] Design DynamoDB table structure
- [ ] Create GSI (Global Secondary Indexes) for queries
- [ ] Set up DynamoDB Streams for real-time updates
- [ ] Configure encryption and backup

#### Week 4: Data Migration
```javascript
// Firestore to DynamoDB migration script
const migrateCollection = async (collectionName, tableName) => {
  const snapshot = await db.collection(collectionName).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    await dynamodb.putItem({
      TableName: tableName,
      Item: {
        id: { S: doc.id },
        ...convertToDynamoDBFormat(data)
      }
    }).promise();
  }
};
```

### Phase 4: Storage Migration (Week 5)

#### Day 1-3: S3 Setup
- [ ] Create S3 buckets with proper encryption
- [ ] Set up CloudFront distribution
- [ ] Configure CORS and access policies

#### Day 4-7: File Migration
```javascript
// Firebase Storage to S3 migration
const migrateFiles = async () => {
  const files = await storage.bucket().getFiles();
  
  for (const file of files[0]) {
    const [buffer] = await file.download();
    await s3.upload({
      Bucket: S3_BUCKET,
      Key: file.name,
      Body: buffer,
      ServerSideEncryption: 'AES256'
    }).promise();
  }
};
```

### Phase 5: API Migration (Week 6)

#### Lambda Functions Setup
- [ ] Create Lambda functions for each service
- [ ] Set up API Gateway with proper routing
- [ ] Configure authentication and authorization
- [ ] Test all endpoints

### Phase 6: Testing & Go-Live (Week 7-8)

#### Week 7: Comprehensive Testing
- [ ] Unit tests for all AWS services
- [ ] Integration tests for complete workflows
- [ ] Performance testing
- [ ] Security audit
- [ ] HIPAA compliance verification

#### Week 8: Production Deployment
- [ ] Feature flag rollout (gradual migration)
- [ ] Monitor error rates and performance
- [ ] User acceptance testing
- [ ] Full production cutover

---

## 💰 Cost Optimization Strategy

### Free Tier Usage (First 12 months)
- **Cognito**: 50,000 MAU free
- **DynamoDB**: 25GB storage + 25 RCU/WCU free
- **Lambda**: 1M requests + 400,000 GB-seconds free
- **S3**: 5GB storage + 20,000 GET requests free
- **API Gateway**: 1M API calls free

### Estimated Monthly Costs (After Free Tier)
- **Amplify Hosting**: $0 (within free tier for small apps)
- **Cognito**: ~$5-10/month (100-200 active users)
- **DynamoDB**: ~$10-25/month (on-demand pricing)
- **Lambda**: ~$5-15/month (based on usage)
- **S3 + CloudFront**: ~$5-20/month (depending on storage)
- **API Gateway**: ~$3-10/month (based on API calls)

**Total Estimated Cost**: $28-80/month (vs Firebase ~$50-150/month)

---

## 🔐 Security & HIPAA Compliance

### Encryption
- **At Rest**: KMS encryption for DynamoDB, S3
- **In Transit**: TLS 1.2+ for all communications
- **Client-side**: Encrypt sensitive data before storage

### Access Control
- **IAM**: Least privilege access
- **Cognito**: Fine-grained permissions
- **API Gateway**: JWT token validation

### Audit & Monitoring
- **CloudTrail**: All API calls logged
- **CloudWatch**: Real-time monitoring
- **AWS Config**: Compliance rules

### Data Residency
- **Single Region**: All data in us-east-2
- **No Cross-Border**: Data never leaves specified region
- **Backup Encryption**: KMS encrypted backups

---

## 🚀 Quick Start Commands

### 1. Fix Current Issue
```bash
# Update Amplify environment variables
aws amplify put-app --app-id YOUR_APP_ID --environment-variables file://env-vars.json

# Trigger redeploy
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE
```

### 2. Start Migration
```bash
# Clone and setup
git clone https://github.com/Scott0275/SmartCare-Connect.git
cd SmartCare-Connect
git checkout dev

# Install AWS dependencies
npm install aws-amplify @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Deploy infrastructure
cd terraform/envs/dev
terraform init
terraform plan
terraform apply
```

### 3. Test Migration
```bash
# Run tests
npm test

# Check deployment
npm run build
npm start
```

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] AWS account setup with proper permissions
- [ ] Backup all Firebase data
- [ ] Set up monitoring and alerting
- [ ] Create rollback plan

### During Migration
- [ ] Feature flags for gradual rollout
- [ ] Parallel running (Firebase + AWS)
- [ ] Real-time monitoring
- [ ] User communication

### Post-Migration
- [ ] Performance optimization
- [ ] Cost monitoring
- [ ] Security audit
- [ ] Documentation update
- [ ] Team training

---

## 🆘 Rollback Plan

If migration fails:
1. **Immediate**: Switch feature flags back to Firebase
2. **Short-term**: Revert DNS/routing to Firebase hosting
3. **Long-term**: Keep Firebase as backup for 30 days

## 📞 Support Contacts

- **AWS Support**: Enterprise support plan recommended
- **Migration Team**: Assign dedicated team members
- **Stakeholders**: Regular updates and communication

---

**Next Steps**: Start with the immediate Amplify fix, then proceed with Phase 1 infrastructure setup.