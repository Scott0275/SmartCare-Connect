# Get GitHub token from Secrets Manager
data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = "/repo/github/${var.environment}"
}

locals {
  github_secret = jsondecode(data.aws_secretsmanager_secret_version.github_token.secret_string)
}

# Amplify App for Next.js deployment
resource "aws_amplify_app" "main" {
  name         = var.app_name
  repository   = var.github_repo
  access_token = local.github_secret.token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
  EOT

  environment_variables = var.environment_variables
}

# Branch for environment
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.branch_name
  framework   = "Next.js - SSG"
  stage       = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
}

# Domain association
resource "aws_amplify_domain_association" "main" {
  count       = var.domain_name != "" ? 1 : 0
  app_id      = aws_amplify_app.main.id
  domain_name = var.domain_name

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.environment == "prod" ? "" : var.environment
  }
}