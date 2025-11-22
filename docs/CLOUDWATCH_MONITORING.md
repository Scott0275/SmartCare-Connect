# CloudWatch Monitoring & Dashboards

This guide sets up comprehensive monitoring for SmartCare Connect infrastructure.

## Quick Setup

```bash
# Deploy monitoring resources
cd terraform/envs/dev
terraform apply -target=module.monitoring

# View dashboard
aws cloudwatch get-dashboard --dashboard-name smartcare-connect-dev
```

## CloudWatch Dashboard Creation

```hcl
# terraform/modules/monitoring/main.tf

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "smartcare-connect-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average" }],
            ["AWS/Lambda", "Errors", { stat = "Sum" }],
            ["AWS/Lambda", "Throttles", { stat = "Sum" }],
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits"],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits"],
            ["AWS/DynamoDB", "UserErrors"],
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests"],
            ["AWS/CloudFront", "BytesDownloaded"],
            ["AWS/CloudFront", "CacheHitRate"],
          ]
          period = 60
          stat   = "Average"
          region = "us-east-1"  # CloudFront metrics are global
          title  = "CloudFront Performance"
        }
      },
    ]
  })
}
```

## Alarm Configuration

```hcl
# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "smartcare-connect-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Lambda error rate alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "smartcare-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = "smartcare-connect-${var.environment}-patients"
  }
}

# Lambda duration alarm (p95 latency)
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "smartcare-lambda-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 3000  # 3 seconds
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = "smartcare-connect-${var.environment}-patients"
  }
}

# DynamoDB read throttle alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttle" {
  alarm_name          = "smartcare-dynamodb-read-throttle-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    TableName = "smartcare-connect-${var.environment}-patients"
  }
}

# DynamoDB write throttle alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttle" {
  alarm_name          = "smartcare-dynamodb-write-throttle-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    TableName = "smartcare-connect-${var.environment}-patients"
  }
}

# API Gateway 5xx error alarm
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "smartcare-api-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ApiName = "smartcare-connect-${var.environment}-api"
  }
}

# API Gateway 4xx error alarm
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "smartcare-api-4xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300  # 5 minutes
  statistic           = "Sum"
  threshold           = 100
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ApiName = "smartcare-connect-${var.environment}-api"
  }
}

# CloudFront cache hit ratio alarm
resource "aws_cloudwatch_metric_alarm" "cloudfront_cache_hit_low" {
  alarm_name          = "smartcare-cloudfront-cache-hit-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 80  # Alert if cache hit rate < 80%
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.medical_files.id
  }
}
```

## Querying CloudWatch Logs

```bash
# Get Lambda logs for the last hour
aws logs tail /aws/lambda/smartcare-connect-dev-patients --since 1h --follow

# Filter for errors only
aws logs tail /aws/lambda/smartcare-connect-dev-patients --since 1h --filter-pattern "ERROR"

# Get specific metric data
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=smartcare-connect-dev-patients \
  --start-time 2025-11-21T00:00:00Z \
  --end-time 2025-11-21T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum

# Get cost metrics
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## Custom Metrics

Add custom metrics to Lambda functions for business intelligence:

```javascript
// lambda/patients/index.js

const CloudWatch = require('@aws-sdk/client-cloudwatch').CloudWatchClient;
const PutMetricDataCommand = require('@aws-sdk/client-cloudwatch').PutMetricDataCommand;

const cw = new CloudWatch({ region: 'us-east-2' });

async function publishMetric(metricName, value) {
  const command = new PutMetricDataCommand({
    Namespace: 'SmartCareConnect/Patients',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Timestamp: new Date(),
      },
    ],
  });
  await cw.send(command);
}

exports.handler = async (event) => {
  // ... handler code ...
  
  // Publish custom metric
  if (event.httpMethod === 'GET') {
    await publishMetric('PatientRetrievals', 1);
  }
  
  if (event.httpMethod === 'POST') {
    await publishMetric('PatientCreations', 1);
  }
};
```

## Log Insights Queries

```sql
-- Find slowest API calls (p95 latency)
fields @timestamp, @duration, @message
| filter @type = "REPORT"
| stats pct(@duration, 95) as p95_latency by bin(5m)

-- Error trend analysis
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as error_count by bin(1h)

-- Top 10 most common errors
fields @message
| filter @message like /ERROR/
| stats count() as count by @message
| sort count() desc
| limit 10

-- User activity analysis
fields userId, @timestamp
| filter userId != ""
| stats count() as api_calls by userId
| sort api_calls desc

-- Database performance
fields @timestamp, @duration
| filter @message like /DynamoDB/
| stats avg(@duration) as avg_latency, max(@duration) as max_latency by bin(5m)
```

## Monitoring Checklist

- [ ] CloudWatch Dashboard created and shared
- [ ] All critical alarms configured
- [ ] SNS notifications working
- [ ] Log retention set to 30 days (cost optimization)
- [ ] Custom metrics published
- [ ] Log Insights queries saved
- [ ] On-call team has alarm notification access
- [ ] Daily cost trend reviewed

---

**Last Updated**: November 21, 2025
