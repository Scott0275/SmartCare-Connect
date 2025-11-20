output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_rest_api.main.execution_arn}/${var.environment}"
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}