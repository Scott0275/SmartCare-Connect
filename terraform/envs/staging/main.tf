terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "smartcare-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "terraform-locks-staging"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "staging"
      Project     = "SmartCare-Connect"
      ManagedBy   = "Terraform"
    }
  }
}

module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
}

module "storage" {
  source = "../../modules/storage"

  project_name = var.project_name
  environment  = var.environment
}

module "api" {
  source = "../../modules/api"

  project_name = var.project_name
  environment  = var.environment

  patients_table_name     = "patients-table-${var.environment}"
  users_table_name        = "users-table-${var.environment}"
  appointments_table_name = "appointments-table-${var.environment}"
  cognito_user_pool_id    = "placeholder-cognito-pool-id"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID for staging"
  value       = "placeholder-cognito-pool-id"
}

output "cognito_client_id" {
  description = "Cognito Client ID for staging"
  value       = "placeholder-cognito-client-id"
}

output "dynamodb_tables" {
  description = "DynamoDB table names for staging"
  value = {
    patients      = "patients-table-${var.environment}"
    users         = "users-table-${var.environment}"
    appointments  = "appointments-table-${var.environment}"
    prescriptions = "prescriptions-table-${var.environment}"
  }
}

output "api_endpoint" {
  description = "API Gateway endpoint for staging"
  value       = "https://api-placeholder.smartcare-connect.com/api"
}

output "s3_bucket" {
  description = "S3 bucket name for staging"
  value       = "smartcare-medical-files-${var.environment}"
}

output "cloudfront_domain" {
  description = "CloudFront domain for staging"
  value       = "placeholder-cloudfront.example.com"
}
