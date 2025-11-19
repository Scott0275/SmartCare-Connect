#!/bin/bash

# SmartCare Connect AWS Setup Script
set -e

echo "🏥 Setting up SmartCare Connect on AWS..."

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "AWS CLI required but not installed. Aborting." >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Terraform required but not installed. Aborting." >&2; exit 1; }

# Create S3 bucket for Terraform state
echo "📦 Creating Terraform state bucket..."
aws s3 mb s3://smartcare-terraform-state --region af-south-1 || echo "Bucket may already exist"

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket smartcare-terraform-state \
    --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
echo "🔒 Creating Terraform lock table..."
aws dynamodb create-table \
    --table-name terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region af-south-1 || echo "Table may already exist"

# Initialize Terraform
echo "🚀 Initializing Terraform..."
cd terraform/envs/dev
terraform init

echo "✅ AWS setup complete! Next steps:"
echo "1. Update terraform.tfvars with your values"
echo "2. Run: terraform plan"
echo "3. Run: terraform apply"