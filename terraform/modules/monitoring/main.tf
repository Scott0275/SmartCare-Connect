# CloudWatch alarms for application monitoring
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors high error rate"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
  }
}

resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000"
  alarm_description   = "This metric monitors high response time"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
  }
}

# Cost anomaly detection
resource "aws_ce_anomaly_detector" "service_monitor" {
  name         = "${var.project_name}-${var.environment}-cost-anomaly"
  monitor_type = "DIMENSIONAL"

  specification = jsonencode({
    Dimension = "SERVICE"
    MatchOptions = ["EQUALS"]
    Values = ["Amazon Simple Storage Service", "Amazon CloudFront", "AWS Amplify"]
  })
}

# Budget alert
resource "aws_budgets_budget" "monthly" {
  name         = "${var.project_name}-${var.environment}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filters = {
    Service = ["Amazon Simple Storage Service", "Amazon CloudFront", "AWS Amplify"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}