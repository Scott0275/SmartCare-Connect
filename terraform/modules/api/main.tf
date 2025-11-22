# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "SmartCare Connect API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.patients_get,
    aws_api_gateway_method.patients_post,
    aws_api_gateway_method.health_get,
    aws_api_gateway_method.create_user_post,
    aws_api_gateway_method.analytics_summary_get,
    aws_api_gateway_integration.patients_get,
    aws_api_gateway_integration.patients_post,
    aws_api_gateway_integration.health_get,
    aws_api_gateway_integration.create_user_post,
    aws_api_gateway_integration.analytics_summary_get
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.patients.id,
      aws_api_gateway_method.patients_get.id,
      aws_api_gateway_method.patients_post.id,
      aws_api_gateway_integration.patients_get.id,
      aws_api_gateway_integration.patients_post.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# CORS configuration
resource "aws_api_gateway_method" "options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_rest_api.main.root_resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_rest_api.main.root_resource_id
  http_method = aws_api_gateway_method.options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_rest_api.main.root_resource_id
  http_method = aws_api_gateway_method.options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_rest_api.main.root_resource_id
  http_method = aws_api_gateway_method.options.http_method
  status_code = aws_api_gateway_method_response.options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway resources
resource "aws_api_gateway_resource" "patients" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "patients"
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_resource" "create_user" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "createUser"
}

resource "aws_api_gateway_resource" "analytics" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "analytics"
}

resource "aws_api_gateway_resource" "analytics_summary" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.analytics.id
  path_part   = "summary"
}

# Patients GET method
resource "aws_api_gateway_method" "patients_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.patients.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "patients_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.patients.id
  http_method = aws_api_gateway_method.patients_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.patients.invoke_arn
}

# Patients POST method
resource "aws_api_gateway_method" "patients_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.patients.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "patients_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.patients.id
  http_method = aws_api_gateway_method.patients_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.patients.invoke_arn
}

# Lambda functions
resource "aws_lambda_function" "patients" {
  filename         = data.archive_file.patients_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-patients"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.patients_zip.output_base64sha256
  runtime         = "nodejs18.x"

  environment {
    variables = {
      DYNAMODB_TABLE = var.patients_table_name
    }
  }
}

resource "aws_lambda_function" "health" {
  filename         = data.archive_file.health_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-health"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.health_zip.output_base64sha256
  runtime         = "nodejs18.x"
}

resource "aws_lambda_function" "create_user" {
  filename         = data.archive_file.create_user_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-create-user"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.create_user_zip.output_base64sha256
  runtime         = "nodejs18.x"

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      USERS_TABLE = var.users_table_name
    }
  }
}

resource "aws_lambda_function" "analytics" {
  filename         = data.archive_file.analytics_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-analytics"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.analytics_zip.output_base64sha256
  runtime         = "nodejs18.x"

  environment {
    variables = {
      PATIENTS_TABLE = var.patients_table_name
      APPOINTMENTS_TABLE = var.appointments_table_name
    }
  }
}

# Health endpoint
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  integration_http_method = "POST"
  type = "AWS_PROXY"
  uri = aws_lambda_function.health.invoke_arn
}

# Create User endpoint
resource "aws_api_gateway_method" "create_user_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.create_user.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_user_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.create_user.id
  http_method = aws_api_gateway_method.create_user_post.http_method
  integration_http_method = "POST"
  type = "AWS_PROXY"
  uri = aws_lambda_function.create_user.invoke_arn
}

# Analytics Summary endpoint
resource "aws_api_gateway_method" "analytics_summary_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.analytics_summary.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "analytics_summary_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.analytics_summary.id
  http_method = aws_api_gateway_method.analytics_summary_get.http_method
  integration_http_method = "POST"
  type = "AWS_PROXY"
  uri = aws_lambda_function.analytics.invoke_arn
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "patients_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.patients.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "health_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "create_user_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "analytics_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsers"
        ]
        Resource = "*"
      }
    ]
  })
}

# Create Lambda deployment packages
# NOTE: Assuming a 'patients' lambda directory exists in c:/Projects/SmartCare-Connect/lambda/patients
data "archive_file" "patients_zip" {
  type        = "zip"
  output_path = "${path.root}/patients.zip"
  source_dir  = abspath("${path.module}/../../../lambda/patients")
}

data "archive_file" "health_zip" {
  type        = "zip"
  output_path = "${path.root}/health.zip"
  source_dir  = abspath("${path.module}/../../../lambda/health")
}

data "archive_file" "create_user_zip" {
  type        = "zip"
  output_path = "${path.root}/create_user.zip"
  source_dir  = abspath("${path.module}/../../../lambda/createUser")
}

data "archive_file" "analytics_zip" {
  type        = "zip"
  output_path = "${path.root}/analytics.zip"
  source_dir  = abspath("${path.module}/../../../lambda/analytics")
}