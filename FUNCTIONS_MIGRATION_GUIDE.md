# Functions Migration Guide: Next.js API Routes → AWS Lambda

## 🎯 Migration Overview

This guide covers migrating from Next.js API routes to AWS Lambda functions with API Gateway for the SmartCare Connect healthcare management system.

## 🏗️ Architecture Changes

### Before (Next.js API Routes)
```
Client → Next.js API Routes → Firebase/Database
```

### After (AWS Lambda + API Gateway)
```
Client → API Gateway → Lambda Functions → DynamoDB/Cognito
```

## 📋 Migrated Functions

| Next.js Route | Lambda Function | Status |
|---------------|-----------------|--------|
| `/api/health` | `health` | ✅ Migrated |
| `/api/createUser` | `createUser` | ✅ Migrated |
| `/api/analytics/summary` | `analytics` | ✅ Migrated |
| `/api/patients` | `patients` | ✅ Migrated |

## 🚀 Migration Steps

### Step 1: Deploy Lambda Functions
```bash
# Deploy via Terraform
cd terraform/envs/dev
terraform plan
terraform apply
```

### Step 2: Test Lambda Functions
```bash
# Test all functions via API Gateway
npm run test:lambda

# Test individual function locally
npm run test:lambda:local health
```

### Step 3: Update Client Code
```typescript
// OLD: Direct API calls
const response = await fetch('/api/health');

// NEW: Unified API service
import ApiService from '@/lib/apiService';
const response = await ApiService.healthCheck();
```

### Step 4: Environment Configuration
```env
# Enable AWS Lambda usage
NEXT_PUBLIC_USE_AWS=true
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/dev
```

## 🔧 Lambda Function Details

### 1. Health Check Function
- **Path**: `/health`
- **Method**: GET
- **Purpose**: System health monitoring
- **Response**: Service status and timestamp

### 2. Create User Function
- **Path**: `/createUser`
- **Method**: POST
- **Purpose**: Admin user creation
- **Integration**: Cognito + DynamoDB
- **Auth**: Bearer token required

### 3. Analytics Function
- **Path**: `/analytics/summary`
- **Method**: GET
- **Purpose**: Dashboard analytics
- **Integration**: DynamoDB aggregation
- **Parameters**: dateRange, department

### 4. Patients Function
- **Path**: `/patients`
- **Methods**: GET, POST, PUT, DELETE
- **Purpose**: Patient management
- **Integration**: DynamoDB operations

## 🔐 Security Features

### 1. **API Gateway Security**
- CORS configuration
- Request validation
- Rate limiting (optional)
- WAF integration (optional)

### 2. **Lambda Security**
- IAM roles with least privilege
- Environment variable encryption
- VPC configuration (if needed)
- CloudWatch logging

### 3. **Authentication**
- Cognito JWT token validation
- Role-based access control
- Admin-only endpoints protection

## 📊 Performance Optimizations

### 1. **Cold Start Reduction**
- Provisioned concurrency for critical functions
- Connection pooling for DynamoDB
- Minimal dependencies

### 2. **Caching Strategy**
- API Gateway caching (optional)
- Lambda response caching
- DynamoDB DAX (if needed)

### 3. **Monitoring**
- CloudWatch metrics
- X-Ray tracing
- Custom dashboards

## 🧪 Testing Strategy

### 1. **Unit Tests**
```bash
# Test Lambda function locally
npm run test:lambda:local health
```

### 2. **Integration Tests**
```bash
# Test via API Gateway
npm run test:lambda
```

### 3. **Load Testing**
```bash
# Use Artillery or similar tool
artillery run load-test-config.yml
```

## 🔄 Gradual Migration

### Phase 1: Parallel Running
```typescript
// Use feature flag to switch between implementations
const useAWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

if (useAWS) {
  return ApiService.healthCheck();
} else {
  return fetch('/api/health').then(r => r.json());
}
```

### Phase 2: Traffic Splitting
- Route 10% traffic to Lambda
- Monitor error rates and performance
- Gradually increase to 100%

### Phase 3: Complete Migration
- Remove Next.js API routes
- Update all client code
- Clean up unused dependencies

## 🚨 Troubleshooting

### Common Issues

#### 1. **CORS Errors**
```javascript
// Ensure proper CORS headers in Lambda response
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};
```

#### 2. **Cold Start Issues**
```javascript
// Initialize clients outside handler
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  // Handler code here
};
```

#### 3. **Environment Variables**
```bash
# Check Lambda environment variables
aws lambda get-function-configuration --function-name your-function-name
```

### Monitoring Commands

#### 1. **CloudWatch Logs**
```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/smartcare
```

#### 2. **API Gateway Metrics**
```bash
# Check API Gateway metrics
aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway --metric-name Count
```

## 💰 Cost Optimization

### 1. **Lambda Pricing**
- Free tier: 1M requests/month
- Pay per request and duration
- Optimize memory allocation

### 2. **API Gateway Pricing**
- Free tier: 1M API calls/month
- Consider REST vs HTTP API
- Enable caching for read-heavy endpoints

### 3. **Monitoring Costs**
- CloudWatch logs retention
- X-Ray sampling rates
- Custom metrics usage

## ✅ Migration Checklist

- [x] Lambda functions created
- [x] API Gateway configured
- [x] IAM roles and policies set up
- [x] Environment variables configured
- [x] CORS properly configured
- [x] Error handling implemented
- [x] Logging and monitoring set up
- [ ] Load testing completed
- [ ] Client code updated
- [ ] Feature flags implemented
- [ ] Gradual rollout plan
- [ ] Rollback procedures tested
- [ ] Documentation updated
- [ ] Team training completed

## 🔄 Rollback Plan

If issues occur during migration:

1. **Immediate Rollback**:
   ```env
   NEXT_PUBLIC_USE_AWS=false
   ```

2. **Partial Rollback**:
   - Rollback specific functions
   - Keep working functions on Lambda

3. **Infrastructure Rollback**:
   ```bash
   terraform destroy -target=module.api
   ```

## 📞 Support Resources

- **AWS Lambda Documentation**: https://docs.aws.amazon.com/lambda/
- **API Gateway Documentation**: https://docs.aws.amazon.com/apigateway/
- **CloudWatch Monitoring**: https://docs.aws.amazon.com/cloudwatch/
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/

---

**Next Steps**: After completing functions migration, proceed to [Phase 6: Testing & Optimization](./PHASE6_TESTING_OPTIMIZATION.md)