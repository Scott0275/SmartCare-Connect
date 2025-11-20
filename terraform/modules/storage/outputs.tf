output "s3_bucket_name" {
  description = "S3 bucket name for medical files"
  value       = aws_s3_bucket.medical_files.bucket
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.medical_files.domain_name
}