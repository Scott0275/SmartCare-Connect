terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
<<<<<<< HEAD
  backend "s3" {
    bucket         = "smartcare-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "af-south-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "af-south-1"
=======
}

provider "aws" {
  region = "us-east-2"
>>>>>>> dev
  default_tags {
    tags = {
      Project     = "SmartCare-Connect"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}

<<<<<<< HEAD
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Project     = "SmartCare-Connect"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}

# Amplify hosting
module "amplify" {
  source = "../../modules/amplify"
  providers = {
    aws = aws.us_east_1
  }

  app_name    = "smartcare-connect-dev"
  github_repo = "https://github.com/Scott0275/SmartCare-Connect"
  branch_name = "main"
  environment = "dev"

  environment_variables = {
    NEXT_PUBLIC_FIREBASE_API_KEY             = var.firebase_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         = "smartcare-connect-bae0d.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID          = "smartcare-connect-bae0d"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      = "smartcare-connect-bae0d.firebasestorage.app"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "1092500862245"
    NEXT_PUBLIC_FIREBASE_APP_ID              = "1:1092500862245:web:720d075f8314b0420016cc"
    NEXT_PUBLIC_USE_EMULATOR                 = "false"
  }
}

# Security module
module "security" {
  source = "../../modules/security"

  project_name                    = "smartcare-connect"
  environment                     = "dev"
  alert_email                     = var.alert_email
  firebase_api_key               = var.firebase_api_key
  firebase_auth_domain           = "smartcare-connect-bae0d.firebaseapp.com"
  firebase_project_id            = "smartcare-connect-bae0d"
  firebase_storage_bucket        = "smartcare-connect-bae0d.firebasestorage.app"
  firebase_messaging_sender_id   = "1092500862245"
  firebase_app_id                = "1:1092500862245:web:720d075f8314b0420016cc"
  firebase_service_account       = var.firebase_service_account
}

=======
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
  
  project_name        = "smartcare-connect"
  environment         = "dev"
  patients_table_name = module.dynamodb.table_names.patients
}
>>>>>>> dev
