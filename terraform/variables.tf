variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "smartcare-connect"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository"
  type        = string
  default     = "Scott0275/SmartCare-Connect"
}