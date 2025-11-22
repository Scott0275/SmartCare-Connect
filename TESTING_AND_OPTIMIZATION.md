# Phase 6: Testing & Optimization (Week 7-8)

## 📋 Overview
This phase focuses on comprehensive testing, performance optimization, security hardening, HIPAA compliance verification, and go-live preparation before moving SmartCare Connect from Firebase to AWS infrastructure.

---

## 🧪 1. End-to-End Testing

### 1.1 Test Environments
- **Dev**: `terraform/envs/dev` (current)
- **Staging**: `terraform/envs/staging` (create similar to dev)
- **Production**: `terraform/envs/prod` (final deployment)

### 1.2 E2E Test Suite

Create `tests/e2e/` directory with the following test files:

#### Authentication Flow (`tests/e2e/auth.spec.ts`)
```typescript
describe('Authentication Flow', () => {
  test('User registration via Cognito', async () => {
    // 1. Call createUser Lambda
    // 2. Verify user in Cognito User Pool
    // 3. Verify user role in DynamoDB users table
  });

  test('User login and token generation', async () => {
    // 1. Login via Cognito
    // 2. Receive tokens (ID, access, refresh)
    // 3. Verify token validity
  });

  test('Role-based access control', async () => {
    // 1. Login as patient
    // 2. Verify access to patient endpoints
    // 3. Verify restricted access to admin endpoints
  });

  test('Token refresh workflow', async () => {
    // 1. Use refresh token to get new access token
    // 2. Verify new token is valid
    // 3. Verify old token is invalidated after TTL
  });

  test('Logout and session termination', async () => {
    // 1. Logout user
    // 2. Verify tokens are revoked
    // 3. Verify subsequent API calls fail with 401
  });
});
```

#### API Gateway & Lambda Integration (`tests/e2e/api.spec.ts`)
```typescript
describe('API Gateway & Lambda Integration', () => {
  const API_BASE_URL = process.env.API_GATEWAY_URL;

  test('GET /patients returns list of patients', async () => {
    // 1. Call GET /patients
    // 2. Verify response format matches schema
    // 3. Verify response time < 500ms
  });

  test('POST /patients creates patient record', async () => {
    // 1. Call POST /patients with valid patient data
    // 2. Verify patient stored in DynamoDB
    // 3. Verify response includes patient ID
  });

  test('GET /health returns service status', async () => {
    // 1. Call GET /health
    // 2. Verify response is { status: 'ok' }
  });

  test('POST /createUser creates user in Cognito', async () => {
    // 1. Call POST /createUser with admin credentials
    // 2. Verify user created in Cognito
    // 3. Verify user record in DynamoDB
  });

  test('GET /analytics/summary returns analytics', async () => {
    // 1. Call GET /analytics/summary
    // 2. Verify metrics structure
    // 3. Verify data accuracy against DynamoDB
  });

  test('CORS headers present in responses', async () => {
    // 1. Call API endpoint
    // 2. Verify `Access-Control-Allow-Origin: *`
    // 3. Verify `Access-Control-Allow-Methods` includes required verbs
  });

  test('Error handling for invalid requests', async () => {
    // 1. Call endpoint with missing required fields
    // 2. Verify 400 error response
    // 3. Verify error message is descriptive
  });

  test('Authentication required for protected endpoints', async () => {
    // 1. Call endpoint without Authorization header
    // 2. Verify 401 Unauthorized response
  });
});
```

#### Database Operations (`tests/e2e/database.spec.ts`)
```typescript
describe('DynamoDB Operations', () => {
  test('Patient record persistence', async () => {
    // 1. Insert patient via Lambda
    // 2. Query patient via Lambda
    // 3. Verify all attributes match
  });

  test('Appointment scheduling', async () => {
    // 1. Create appointment record
    // 2. Query by patient ID
    // 3. Query by date range
    // 4. Verify GSI queries work
  });

  test('Transactions and consistency', async () => {
    // 1. Create patient + add appointment in single transaction
    // 2. Verify both succeed or both fail atomically
  });

  test('Data backup and recovery', async () => {
    // 1. Enable DynamoDB Point-in-Time Recovery (PITR)
    // 2. Restore from backup point
    // 3. Verify data integrity
  });
});
```

#### File Storage & CloudFront (`tests/e2e/storage.spec.ts`)
```typescript
describe('S3 & CloudFront', () => {
  test('Upload medical file to S3', async () => {
    // 1. Upload file via presigned URL
    // 2. Verify object in S3 bucket
    // 3. Verify encryption at rest
  });

  test('Download file via CloudFront', async () => {
    // 1. Request file via CloudFront URL
    // 2. Verify response time (should be cached)
    // 3. Verify correct file content
  });

  test('File access control', async () => {
    // 1. Attempt unauthorized S3 access
    // 2. Verify 403 Forbidden
  });
});
```

### 1.3 Running E2E Tests

```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest aws-sdk

# Create jest.config.js
npx jest tests/e2e/ --coverage

# Generate coverage report
npx jest tests/e2e/ --coverage --coverageReporters=html
```

### 1.4 Test Execution Checklist
- [ ] All E2E tests pass in dev environment
- [ ] All E2E tests pass in staging environment
- [ ] Code coverage > 80% for critical paths
- [ ] No flaky tests (run test suite 3x, all pass)
- [ ] Performance tests pass (no timeout failures)

---

## ⚡ 2. Performance Optimization

### 2.1 CloudWatch Monitoring Setup

Create CloudWatch dashboards to monitor:

**Lambda Performance** (`terraform/modules/api/cloudwatch.tf`)
```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "smartcare-lambda-duration-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 3000  # 3 seconds
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "smartcare-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

**DynamoDB Performance**
```hcl
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "smartcare-dynamodb-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 250  # On-demand limit
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

### 2.2 Lambda Optimization

**Cold Start Reduction**
- [ ] Use provisioned concurrency for critical functions (patients, createUser)
- [ ] Reduce bundle size (tree-shake unused dependencies)
- [ ] Use Lambda Layers for shared code
- [ ] Consider ARM-based Graviton processors for cost savings

**Memory & Timeout Tuning**
```hcl
resource "aws_lambda_function" "patients" {
  # ... existing config ...
  memory_size = 512  # Increase from default 128
  timeout     = 30   # seconds
}
```

**Performance Benchmarks**
- Patients GET: < 200ms (p95)
- Patients POST: < 500ms (p95)
- Health check: < 100ms (p95)
- CreateUser: < 1s (p95)
- Analytics: < 2s (p95)

### 2.3 DynamoDB Optimization

**On-Demand vs Provisioned**
- Current: On-Demand billing (pay-per-request)
- Cost optimization: If predictable traffic, switch to provisioned
- Recommended: Keep On-Demand for first 3 months, then analyze

**Query Optimization**
- Use Global Secondary Indexes (GSI) for common queries
- Example GSI: `appointments` table by `patient_id` and `date`
- Avoid table scans; always use Query with partition key

**Capacity Planning**
```hcl
resource "aws_dynamodb_table" "patients" {
  # ... existing config ...
  
  # On-demand
  billing_mode = "PAY_PER_REQUEST"
  
  # Global Secondary Index for common queries
  global_secondary_index {
    name            = "patient-id-date-index"
    hash_key        = "patient_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }
}
```

### 2.4 API Gateway Optimization

- [ ] Enable caching for GET endpoints (TTL: 5 minutes for read-heavy)
- [ ] Use API Gateway throttling (10,000 requests/sec default)
- [ ] Enable compression for responses > 1KB
- [ ] Use regional endpoints (not edge-optimized) for lower latency

### 2.5 CloudFront Optimization

- [ ] Set appropriate cache TTLs (static: 1 day, dynamic: 5 mins)
- [ ] Enable compression for text/JSON (gzip, brotli)
- [ ] Use origin shield for additional caching layer
- [ ] Monitor cache hit ratio (target > 80%)

### 2.6 Performance Testing

```bash
# Install load testing tool
npm install --save-dev artillery

# Create artillery.yml
yaml
config:
  target: "{{ $processEnvironment.API_URL }}"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Sustained load"

scenarios:
  - name: "Patient API"
    flow:
      - get:
          url: "/patients"
          expect:
            - statusCode: 200
      - post:
          url: "/patients"
          json:
            name: "Test Patient"
            age: 30
          expect:
            - statusCode: 201
```

Run: `npx artillery run artillery.yml`

### 2.7 Optimization Checklist
- [ ] Lambda p95 latency < benchmark
- [ ] DynamoDB throttling never exceeded
- [ ] CloudFront cache hit ratio > 80%
- [ ] API response times meet SLA
- [ ] No memory leaks in Lambda (CloudWatch metrics)
- [ ] Cost within budget ($100-200/month)

---

## 🔒 3. Security Audit

### 3.1 Infrastructure Security

**IAM Role Review**
```bash
# Verify least-privilege principles
aws iam get-role --role-name smartcare-connect-dev-lambda-role
# Check attached policies - should be minimal
```

Checklist:
- [ ] Lambda IAM role has only required DynamoDB/S3 permissions
- [ ] API Gateway doesn't expose internal resources
- [ ] No hardcoded credentials in code/terraform
- [ ] Secrets stored in AWS Secrets Manager (not env vars)

**Network Security**
- [ ] DynamoDB configured with VPC endpoints (private access)
- [ ] S3 bucket policy blocks public access
- [ ] CloudFront uses HTTPS only (redirect HTTP → HTTPS)
- [ ] WAF rules enabled on CloudFront

**Encryption Verification**
```bash
# Verify S3 encryption
aws s3api get-bucket-encryption --bucket smartcare-connect-dev-medical-files

# Verify DynamoDB encryption
aws dynamodb describe-table --table-name smartcare-connect-dev-patients \
  | grep SSEDescription
```

### 3.2 Application Security

**Authentication & Authorization**
- [ ] Cognito MFA enabled for admin users
- [ ] Password policy enforced (8+ chars, uppercase, lowercase, numbers, symbols)
- [ ] Role-based access control (RBAC) implemented for all endpoints
- [ ] API Gateway has request/response validation

**Data Protection**
- [ ] Sensitive data encrypted at rest (KMS)
- [ ] Sensitive data encrypted in transit (TLS 1.2+)
- [ ] Client-side encryption for PII before transmission
- [ ] No sensitive data in logs or error messages

**Input Validation**
```typescript
// Example: Validate patient creation request
POST /patients
{
  "name": "string",      // required, max 100
  "age": "number",       // required, 0-120
  "email": "email",      // required, valid email
  "phone": "string",     // optional, valid phone format
  "address": "string"    // optional, max 500
}
```

### 3.3 Dependency & Code Security

```bash
# Check for vulnerable dependencies
npm audit

# SonarQube / CodeQL scan (optional but recommended)
npm install --save-dev sonarqube-scanner

# OWASP Top 10 checklist
# [ ] SQL Injection: Not applicable (DynamoDB, no SQL)
# [ ] Broken Authentication: Cognito handles this
# [ ] Broken Access Control: RBAC + IAM policies
# [ ] XSS: CSP headers + input sanitization
# [ ] CSRF: Same-origin + token validation
# [ ] XXE: XML parsing disabled
# [ ] Insecure Deserialization: No deserialization
# [ ] Broken Access Control: Verified above
# [ ] Using Components with Known Vulnerabilities: npm audit
# [ ] Insufficient Logging & Monitoring: CloudWatch + CloudTrail
```

### 3.4 Security Audit Checklist
- [ ] OWASP Top 10 verified
- [ ] IAM roles follow least-privilege
- [ ] No hardcoded secrets
- [ ] Encryption enabled (at rest + in transit)
- [ ] MFA enabled for privileged users
- [ ] Audit logging enabled (CloudTrail, CloudWatch)
- [ ] Penetration testing completed (optional, recommended)
- [ ] Dependency scan passed (no critical vulnerabilities)

---

## 🏥 4. HIPAA Compliance Verification

### 4.1 HIPAA Requirements Checklist

**Administrative Safeguards**
- [ ] Business Associate Agreement (BAA) signed with AWS
- [ ] Security officer assigned
- [ ] Access control procedures documented
- [ ] Audit controls implemented
- [ ] Integrity controls (data cannot be altered undetected)
- [ ] Workforce security (access restricted to authorized personnel)

**Physical Safeguards**
- [ ] Data center physical security (AWS responsibility)
- [ ] Facility access controls logged
- [ ] Workstation use policies defined
- [ ] Workstation security policies enforced

**Technical Safeguards**
- [ ] Encryption at rest: ✅ KMS for DynamoDB, S3
- [ ] Encryption in transit: ✅ TLS 1.2+ for all communications
- [ ] Access controls: ✅ IAM + Cognito RBAC
- [ ] Audit controls: ✅ CloudTrail + CloudWatch Logs
- [ ] Integrity controls: ✅ DynamoDB integrity checks
- [ ] Transmission security: ✅ HTTPS, VPC endpoints

**Privacy Safeguards**
- [ ] Privacy notices displayed to patients
- [ ] Patient consent obtained for data use
- [ ] Access logs reviewed regularly
- [ ] Breach notification procedures in place
- [ ] Data retention policies defined
- [ ] Patient data accessible only by authorized users

### 4.2 Audit Logging Configuration

```hcl
# CloudTrail for API audit logs
resource "aws_cloudtrail" "main" {
  name                          = "smartcare-connect-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  depends_on = [aws_s3_bucket_policy.cloudtrail_policy]
}

# CloudWatch Logs for application logs
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/smartcare-connect"
  retention_in_days = 30  # HIPAA requires 6 years, but cost-prohibitive; use S3 archival

  tags = {
    Compliance = "HIPAA"
  }
}

# S3 archival for long-term compliance retention
resource "aws_s3_bucket_lifecycle_configuration" "logs_archival" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "archive-after-30-days"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}
```

### 4.3 Data Residency & Compliance

- [ ] All resources deployed in `us-east-2` (single region)
- [ ] Data never leaves the region (no replication outside US)
- [ ] Backup retention: 30 days (DynamoDB PITR)
- [ ] Disaster recovery: Multi-AZ deployments

### 4.4 HIPAA Compliance Checklist
- [ ] BAA signed with AWS
- [ ] Encryption at rest & in transit enabled
- [ ] Access controls & audit logging in place
- [ ] Privacy policies documented & displayed
- [ ] Data retention & destruction policies defined
- [ ] Breach response plan documented
- [ ] Employee security training completed
- [ ] Compliance audit completed by third party (recommended)

---

## 🚀 5. Go-Live Preparation

### 5.1 Deployment Runbook

**Pre-Deployment Checklist**
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] HIPAA compliance verified
- [ ] Disaster recovery tested
- [ ] Team trained on runbook
- [ ] Rollback plan documented
- [ ] Customer communication planned

**Deployment Steps**

```bash
# 1. Create staging environment snapshot
cd terraform/envs/prod
terraform plan -out=plan.tfplan

# 2. Review plan
cat plan.tfplan

# 3. Deploy to production
terraform apply plan.tfplan

# 4. Verify deployment
./scripts/verify-deployment.sh

# 5. Run smoke tests
npx jest tests/smoke/ --timeout=10000

# 6. Monitor for 1 hour (watch CloudWatch dashboards)
```

### 5.2 Cutover Plan

**Parallel Run Period (1 week)**
- Firebase and AWS running simultaneously
- Feature flags toggle between systems
- Monitor both systems for anomalies

**Cutover Day**
- [ ] 6:00 PM - Start maintenance window
- [ ] 6:00-6:30 PM - Final backup of Firebase data
- [ ] 6:30-7:00 PM - Migrate remaining data to DynamoDB
- [ ] 7:00-7:30 PM - Verify data migration completeness
- [ ] 7:30-8:00 PM - Switch DNS/routing to AWS
- [ ] 8:00-9:00 PM - Monitor critical user journeys
- [ ] 9:00+ PM - Declare success or rollback

**Rollback Plan**
If critical issues within 1 hour:
```bash
# 1. Switch DNS back to Firebase
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://rollback-dns.json

# 2. Verify traffic routed to Firebase
# 3. Investigate issue in AWS environment
# 4. Fix issue
# 5. Retry cutover next day
```

### 5.3 Post-Deployment Monitoring (First 24 Hours)

```hcl
# Critical alerts to monitor
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "smartcare-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 50  # >50 errors in 2 minutes
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "database_throttle" {
  alarm_name          = "smartcare-db-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 250
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
}
```

### 5.4 Go-Live Checklist
- [ ] Runbook reviewed and approved
- [ ] Rollback plan tested
- [ ] Team trained on procedures
- [ ] Customer communication sent
- [ ] Monitoring dashboards active
- [ ] On-call support scheduled
- [ ] Post-mortem process defined
- [ ] Success criteria defined

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| E2E Test Coverage | > 80% | TBD |
| API p95 Latency | < 500ms | TBD |
| Lambda Error Rate | < 0.1% | TBD |
| DynamoDB Throttle Events | 0 | TBD |
| CloudFront Cache Hit Ratio | > 80% | TBD |
| Monthly Cost | < $200 | TBD |
| HIPAA Compliance | 100% | TBD |
| Security Audit Passed | Yes | TBD |

---

## 📞 Support & Escalation

**On-Call Rotation**
- Primary: [Team Lead]
- Secondary: [Backup Engineer]
- Escalation: [Manager]

**Incident Response**
- Detect → Alert (CloudWatch)
- Triage → Identify root cause
- Mitigate → Apply fix or rollback
- Communicate → Update stakeholders
- Post-Mortem → Document lessons learned

---

## 📈 Next Steps

1. **Week 7 (Days 1-2)**: Set up E2E test suite, run initial tests
2. **Week 7 (Days 3-4)**: Performance testing & optimization
3. **Week 7 (Days 5)**: Security audit & hardening
4. **Week 8 (Days 1-2)**: HIPAA compliance verification
5. **Week 8 (Days 3-5)**: Go-live preparation & cutover

---

**Last Updated**: November 21, 2025  
**Next Review**: Post-go-live (first week)
