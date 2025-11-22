# S3 bucket for medical files
resource "aws_s3_bucket" "medical_files" {
  bucket = "${var.project_name}-${var.environment}-medical-files"

  tags = {
    Name        = "${var.project_name}-${var.environment}-medical-files"
    Environment = var.environment
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "medical_files" {
  bucket = aws_s3_bucket.medical_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "medical_files" {
  bucket = aws_s3_bucket.medical_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "medical_files" {
  bucket = aws_s3_bucket.medical_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "medical_files" {
  origin {
    domain_name = aws_s3_bucket.medical_files.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.medical_files.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.medical_files.cloudfront_access_identity_path
    }
  }

  enabled = true
  comment = "Medical files CDN for ${var.project_name}-${var.environment}"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.medical_files.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 300   # 5 minutes for medical files
    max_ttl     = 3600  # 1 hour max

    # Security headers
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # Price class for cost optimization
  price_class = "PriceClass_100"  # US, Canada, Europe

  tags = {
    Name        = "${var.project_name}-${var.environment}-cdn"
    Environment = var.environment
    Purpose     = "medical-files"
  }
}

# CloudFront Response Headers Policy for security
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${var.project_name}-${var.environment}-security-headers"

  security_headers_config {
    strict_transport_security {
      override                   = true
      access_control_max_age_sec = 31536000
      include_subdomains         = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "X-Medical-File"
      value    = "true"
      override = false
    }
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "medical_files" {
  comment = "OAI for ${var.project_name}-${var.environment}"
}

# S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "medical_files" {
  bucket = aws_s3_bucket.medical_files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.medical_files.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.medical_files.arn}/*"
      }
    ]
  })
}