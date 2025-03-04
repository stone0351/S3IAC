# API Gateway configuration for IAC Platform

# Lambda function for API handlers
resource "aws_lambda_function" "api_handlers_lambda" {
  function_name = "iac-platform-api-handlers"
  filename      = "../backend/lambda/api_handlers_lambda.zip"
  handler       = "api_handlers.handler"
  runtime       = "nodejs16.x"
  timeout       = 30
  memory_size   = 256
  
  role = aws_iam_role.lambda_role.arn
  
  environment {
    variables = {
      USERS_TABLE   = aws_dynamodb_table.users_table.name
      KEYS_TABLE    = aws_dynamodb_table.aws_keys_table.name
      SCRIPTS_TABLE = aws_dynamodb_table.iac_scripts_table.name
    }
  }
}

# API Gateway method and integration for /users (POST - Create user)
resource "aws_api_gateway_method" "users_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.users_resource.id
  http_method             = aws_api_gateway_method.users_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /users (GET - Get user)
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.users_resource.id
  http_method             = aws_api_gateway_method.users_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /keys (POST - Create AWS key)
resource "aws_api_gateway_method" "keys_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.keys_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "keys_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.keys_resource.id
  http_method             = aws_api_gateway_method.keys_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /keys (GET - List AWS keys)
resource "aws_api_gateway_method" "keys_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.keys_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "keys_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.keys_resource.id
  http_method             = aws_api_gateway_method.keys_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /keys (DELETE - Delete AWS key)
resource "aws_api_gateway_method" "keys_delete" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.keys_resource.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "keys_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.keys_resource.id
  http_method             = aws_api_gateway_method.keys_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /scripts (POST - Create IAC script)
resource "aws_api_gateway_method" "scripts_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.scripts_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "scripts_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.scripts_resource.id
  http_method             = aws_api_gateway_method.scripts_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /scripts (GET - List IAC scripts)
resource "aws_api_gateway_method" "scripts_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.scripts_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "scripts_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.scripts_resource.id
  http_method             = aws_api_gateway_method.scripts_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /scripts (DELETE - Delete IAC script)
resource "aws_api_gateway_method" "scripts_delete" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.scripts_resource.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "scripts_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.scripts_resource.id
  http_method             = aws_api_gateway_method.scripts_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handlers_lambda.invoke_arn
}

# API Gateway method and integration for /execute (POST - Execute IAC code)
resource "aws_api_gateway_method" "execute_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.execute_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "execute_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.execute_resource.id
  http_method             = aws_api_gateway_method.execute_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.execute_iac_lambda.invoke_arn
}

# Add CORS support for each resource
resource "aws_api_gateway_method" "users_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "keys_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.keys_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "scripts_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.scripts_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.execute_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Mock integrations for OPTIONS methods
resource "aws_api_gateway_integration" "users_options_integration" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.users_resource.id
  http_method      = aws_api_gateway_method.users_options.http_method
  type             = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "keys_options_integration" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.keys_resource.id
  http_method      = aws_api_gateway_method.keys_options.http_method
  type             = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "scripts_options_integration" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.scripts_resource.id
  http_method      = aws_api_gateway_method.scripts_options.http_method
  type             = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "execute_options_integration" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.execute_resource.id
  http_method      = aws_api_gateway_method.execute_options.http_method
  type             = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# Method responses for OPTIONS
resource "aws_api_gateway_method_response" "users_options_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "keys_options_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.keys_resource.id
  http_method = aws_api_gateway_method.keys_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "scripts_options_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.scripts_resource.id
  http_method = aws_api_gateway_method.scripts_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "execute_options_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.execute_resource.id
  http_method = aws_api_gateway_method.execute_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# Integration responses for OPTIONS
resource "aws_api_gateway_integration_response" "users_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = aws_api_gateway_method_response.users_options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

resource "aws_api_gateway_integration_response" "keys_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.keys_resource.id
  http_method = aws_api_gateway_method.keys_options.http_method
  status_code = aws_api_gateway_method_response.keys_options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

resource "aws_api_gateway_integration_response" "scripts_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.scripts_resource.id
  http_method = aws_api_gateway_method.scripts_options.http_method
  status_code = aws_api_gateway_method_response.scripts_options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

resource "aws_api_gateway_integration_response" "execute_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.execute_resource.id
  http_method = aws_api_gateway_method.execute_options.http_method
  status_code = aws_api_gateway_method_response.execute_options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

# Lambda permissions
resource "aws_lambda_permission" "api_gateway_lambda_permission_api_handlers" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handlers_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*/*"
}

resource "aws_lambda_permission" "api_gateway_lambda_permission_execute_iac" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.execute_iac_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*/*"
}

# API deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.users_post_integration,
    aws_api_gateway_integration.users_get_integration,
    aws_api_gateway_integration.keys_post_integration,
    aws_api_gateway_integration.keys_get_integration,
    aws_api_gateway_integration.keys_delete_integration,
    aws_api_gateway_integration.scripts_post_integration,
    aws_api_gateway_integration.scripts_get_integration,
    aws_api_gateway_integration.scripts_delete_integration,
    aws_api_gateway_integration.execute_post_integration,
    aws_api_gateway_integration.users_options_integration,
    aws_api_gateway_integration.keys_options_integration,
    aws_api_gateway_integration.scripts_options_integration,
    aws_api_gateway_integration.execute_options_integration
  ]
  
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "v1"
  
  lifecycle {
    create_before_destroy = true
  }
}

# Output the deployed API URL
output "api_url" {
  value = "${aws_api_gateway_deployment.api_deployment.invoke_url}"
  description = "URL of the deployed API Gateway"
}
