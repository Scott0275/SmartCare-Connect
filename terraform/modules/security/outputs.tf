output "firebase_secret_id" {
  description = "Firebase secret ID"
  value       = aws_secretsmanager_secret.firebase_config.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.security_alerts.arn
}