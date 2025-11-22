@echo off
echo 🏥 Setting up SmartCare Connect on AWS...

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo AWS CLI required but not installed. Please install AWS CLI first.
    exit /b 1
)

REM Check if Terraform is installed
terraform --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Terraform required but not installed. Please install Terraform first.
    exit /b 1
)

echo 📦 Creating Terraform state bucket...
aws s3 mb s3://smartcare-terraform-state --region us-east-2

echo 🔒 Enabling bucket versioning...
aws s3api put-bucket-versioning --bucket smartcare-terraform-state --versioning-configuration Status=Enabled

echo 🔒 Creating Terraform lock table...
aws dynamodb create-table --table-name terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region us-east-2

echo 🚀 Initializing Terraform...
cd terraform\envs\dev
terraform init

echo ✅ AWS setup complete! Next steps:
echo 1. Run: terraform plan
echo 2. Run: terraform apply