# Secrets Manager for Firebase credentials
resource "aws_secretsmanager_secret" "firebase_config" {
  name        = "/repo/firebase/${var.environment}"
  description = "Firebase configuration for ${var.environment}"
}

resource "aws_secretsmanager_secret_version" "firebase_config" {
  secret_id = aws_secretsmanager_secret.firebase_config.id
  secret_string = jsonencode({
    api_key             = var.firebase_api_key
    auth_domain         = var.firebase_auth_domain
    project_id          = var.firebase_project_id
    storage_bucket      = var.firebase_storage_bucket
    messaging_sender_id = var.firebase_messaging_sender_id
    app_id              = var.firebase_app_id
    service_account     = var.firebase_service_account
  })
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  depends_on     = [aws_s3_bucket_policy.cloudtrail]
  name           = "${var.project_name}-${var.environment}-trail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []


  }
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "${var.project_name}-${var.environment}-cloudtrail"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# GuardDuty for threat detection
resource "aws_guardduty_detector" "main" {
  enable = true
}

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-${var.environment}-security-alerts"
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}