# Phase 1: AWS Infrastructure Deployment Guide

## ✅ Infrastructure Created

I've successfully created all Terraform modules for Phase 1:

### 🏗️ Modules Created:
- **Cognito** (`terraform/modules/cognito/`) - User authentication with role-based access
- **DynamoDB** (`terraform/modules/dynamodb/`) - 6 tables (patients, prescriptions, appointments, vitals, lab_results, billing)
- **Storage** (`terraform/modules/storage/`) - S3 bucket with CloudFront CDN
- **API** (`terraform/modules/api/`) - API Gateway + Lambda functions

## 🚀 Deployment Steps

### Step 1: Configure AWS Credentials

```bash
# Option 1: AWS CLI
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (us-east-2)

# Option 2: Environment Variables
set AWS_ACCESS_KEY_ID=your_access_key
set AWS_SECRET_ACCESS_KEY=your_secret_key
set AWS_DEFAULT_REGION=us-east-2
```

### Step 2: Deploy Infrastructure

```bash
cd terraform/envs/dev
terraform init
terraform plan
terraform apply
```

### Step 3: Get Output Values

After deployment, run:
```bash
terraform output
```

You'll get:
- Cognito User Pool ID
- Cognito Client ID  
- Cognito Identity Pool ID
- S3 Bucket Name
- API Gateway URL
- DynamoDB Table Names

## 📋 Phase 1 Checklist

- [x] ✅ Set up Cognito User Pools
- [x] ✅ Create DynamoDB tables  
- [x] ✅ Configure S3 buckets with encryption
- [x] ✅ Set up Lambda functions
- [x] ✅ Configure API Gateway
- [ ] 🔄 Deploy to AWS (requires AWS credentials)
- [ ] 🔄 Update Amplify environment variables
- [ ] 🔄 Test API endpoints

## 🔧 What's Deployed

### Cognito Authentication
- User Pool with custom attributes (role, department)
- User Pool Client for web app
- Identity Pool for AWS resource access
- Role-based IAM policies

### DynamoDB Tables
- `smartcare-connect-dev-patients`
- `smartcare-connect-dev-prescriptions` 
- `smartcare-connect-dev-appointments`
- `smartcare-connect-dev-vitals`
- `smartcare-connect-dev-lab-results`
- `smartcare-connect-dev-billing`

### S3 Storage
- Encrypted S3 bucket for medical files
- CloudFront CDN for fast access
- Proper IAM policies for secure access

### API Gateway + Lambda
- REST API with CORS enabled
- Lambda function for patients endpoint
- IAM roles with DynamoDB permissions

## 💰 Estimated Costs (Free Tier)

- **Cognito**: Free for first 50,000 MAU
- **DynamoDB**: Free for 25GB + 25 RCU/WCU
- **Lambda**: Free for 1M requests/month
- **S3**: Free for 5GB storage
- **API Gateway**: Free for 1M calls/month

**Total Phase 1 Cost**: $0 (within free tier limits)

## 🔄 Next Steps After Deployment

1. **Update Amplify Environment Variables**:
   ```
   NEXT_PUBLIC_AWS_REGION=us-east-2
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=[from terraform output]
   NEXT_PUBLIC_COGNITO_CLIENT_ID=[from terraform output]
   NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=[from terraform output]
   NEXT_PUBLIC_API_GATEWAY_URL=[from terraform output]
   NEXT_PUBLIC_S3_BUCKET=[from terraform output]
   NEXT_PUBLIC_USE_AWS=true
   ```

2. **Test API Endpoints**:
   ```bash
   # Test patients endpoint
   curl -X GET [API_GATEWAY_URL]/patients
   ```

3. **Begin Phase 2**: Authentication migration from Firebase to Cognito

## 🆘 Troubleshooting

### AWS Credentials Error
```
Error: The security token included in the request is invalid
```
**Solution**: Configure AWS credentials using `aws configure`

### DynamoDB Permission Error
**Solution**: Ensure IAM user has DynamoDB permissions

### S3 Bucket Name Conflict
**Solution**: Bucket names must be globally unique. Update `project_name` in variables.

## 📞 Support

If you encounter issues:
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify region: `aws configure get region`
3. Check Terraform logs for detailed errors
4. Ensure IAM permissions for all services

---

**Ready to deploy?** Run the commands in Step 2 after configuring AWS credentials.