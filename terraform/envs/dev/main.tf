terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-2"
  default_tags {
    tags = {
      Project     = "SmartCare-Connect"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}

# Cognito for authentication
module "cognito" {
  source = "../../modules/cognito"
  
  project_name = "smartcare-connect"
  environment  = "dev"
  aws_region   = "us-east-2"
}

# DynamoDB tables
module "dynamodb" {
  source = "../../modules/dynamodb"
  
  project_name = "smartcare-connect"
  environment  = "dev"
}

# S3 storage and CloudFront
module "storage" {
  source = "../../modules/storage"
  
  project_name = "smartcare-connect"
  environment  = "dev"
}

# API Gateway and Lambda
module "api" {
  source = "../../modules/api"
  
  project_name            = "smartcare-connect"
  environment             = "dev"
  patients_table_name     = module.dynamodb.table_names.patients
  users_table_name        = module.dynamodb.table_names.users
  appointments_table_name = module.dynamodb.table_names.appointments
  cognito_user_pool_id    = module.cognito.user_pool_id
}