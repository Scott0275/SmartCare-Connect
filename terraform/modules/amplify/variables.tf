variable "app_name" {
  description = "Amplify app name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
}

variable "branch_name" {
  description = "Git branch name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Environment variables for Amplify"
  type        = map(string)
  default     = {}
}