#!/bin/bash

# SmartCare Connect - Post-Deployment Verification Script
# Verifies all critical components are deployed and functioning

set -e

echo "🔍 Verifying SmartCare Connect Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper function to check a resource
check_resource() {
  local name=$1
  local command=$2
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} $name"
    ((CHECKS_FAILED++))
  fi
}

# Get outputs from Terraform
echo ""
echo "📦 Checking AWS Resources..."

# Get API Gateway URL
API_URL=$(terraform -chdir=terraform/envs/dev output -raw api_gateway_url 2>/dev/null || echo "")
if [ -z "$API_URL" ]; then
  echo -e "${RED}✗${NC} API Gateway URL not found"
  ((CHECKS_FAILED++))
else
  echo -e "${GREEN}✓${NC} API Gateway URL: $API_URL"
  ((CHECKS_PASSED++))
fi

# Check Lambda functions
echo ""
echo "🔧 Checking Lambda Functions..."
check_resource "Patients Lambda" "aws lambda get-function --function-name smartcare-connect-dev-patients --region us-east-2"
check_resource "Health Lambda" "aws lambda get-function --function-name smartcare-connect-dev-health --region us-east-2"
check_resource "CreateUser Lambda" "aws lambda get-function --function-name smartcare-connect-dev-create-user --region us-east-2"
check_resource "Analytics Lambda" "aws lambda get-function --function-name smartcare-connect-dev-analytics --region us-east-2"

# Check DynamoDB tables
echo ""
echo "🗄️  Checking DynamoDB Tables..."
check_resource "Patients Table" "aws dynamodb describe-table --table-name smartcare-connect-dev-patients --region us-east-2"
check_resource "Appointments Table" "aws dynamodb describe-table --table-name smartcare-connect-dev-appointments --region us-east-2"
check_resource "Users Table" "aws dynamodb describe-table --table-name smartcare-connect-dev-users --region us-east-2"

# Check S3 buckets
echo ""
echo "📦 Checking S3 Buckets..."
check_resource "Medical Files Bucket" "aws s3 ls s3://smartcare-connect-dev-medical-files --region us-east-2"

# Check Cognito
echo ""
echo "🔐 Checking Cognito..."
COGNITO_POOL=$(terraform -chdir=terraform/envs/dev output -raw cognito_user_pool_id 2>/dev/null || echo "")
if [ -n "$COGNITO_POOL" ]; then
  check_resource "Cognito User Pool" "aws cognito-idp describe-user-pool --user-pool-id $COGNITO_POOL --region us-east-2"
else
  echo -e "${RED}✗${NC} Cognito User Pool ID not found"
  ((CHECKS_FAILED++))
fi

# Test API endpoints
echo ""
echo "🌐 Testing API Endpoints..."

if [ -n "$API_URL" ]; then
  # Extract base URL without stage
  BASE_URL=$(echo "$API_URL" | sed 's|/dev||')
  
  # Test health endpoint
  HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dev/health")
  if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Health endpoint (HTTP $HEALTH_RESPONSE)"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} Health endpoint (HTTP $HEALTH_RESPONSE)"
    ((CHECKS_FAILED++))
  fi
  
  # Test patients endpoint (should return 200 or 401 if auth required)
  PATIENTS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dev/patients")
  if [[ "$PATIENTS_RESPONSE" =~ ^(200|401)$ ]]; then
    echo -e "${GREEN}✓${NC} Patients endpoint (HTTP $PATIENTS_RESPONSE)"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} Patients endpoint (HTTP $PATIENTS_RESPONSE)"
    ((CHECKS_FAILED++))
  fi
else
  echo -e "${YELLOW}⚠${NC}  API URL not available - skipping endpoint tests"
fi

# Check CloudWatch Logs
echo ""
echo "📊 Checking CloudWatch Logs..."
check_resource "Lambda Logs" "aws logs describe-log-groups --log-group-name-prefix /aws/lambda/smartcare-connect --region us-east-2"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Checks Passed: $CHECKS_PASSED"
echo "❌ Checks Failed: $CHECKS_FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Deployment verified successfully!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed - review errors above${NC}"
  exit 1
fi
