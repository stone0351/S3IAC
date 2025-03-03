terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# S3 bucket for website hosting
resource "aws_s3_bucket" "website_bucket" {
  bucket = "ssp-getmemap-com"

  tags = {
    Name = "IAC Platform Website"
  }
}

resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.website_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_ownership_controls" "website_bucket_ownership" {
  bucket = aws_s3_bucket.website_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "website_public_access" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website_bucket_policy" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website_bucket.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website_public_access]
}

# DynamoDB tables
resource "aws_dynamodb_table" "users_table" {
  name         = "IAC-Platform-Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "googleId"

  attribute {
    name = "googleId"
    type = "S"
  }

  tags = {
    Name = "IAC Platform Users Table"
  }
}

resource "aws_dynamodb_table" "aws_keys_table" {
  name         = "IAC-Platform-AWSKeys"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Name = "IAC Platform AWS Keys Table"
  }
}

resource "aws_dynamodb_table" "iac_scripts_table" {
  name         = "IAC-Platform-IACScripts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Name = "IAC Platform IAC Scripts Table"
  }
}

# Lambda for executing IAC code
resource "aws_lambda_function" "execute_iac_lambda" {
  function_name = "execute-iac-code"
  filename      = "../backend/lambda/execute_iac_lambda.zip"
  handler       = "execute_iac.handler"
  runtime       = "nodejs16.x"
  timeout       = 30
  memory_size   = 256
  
  role = aws_iam_role.lambda_role.arn
  
  environment {
    variables = {
      KEYS_TABLE    = aws_dynamodb_table.aws_keys_table.name
      SCRIPTS_TABLE = aws_dynamodb_table.iac_scripts_table.name
    }
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "execute-iac-lambda-role"
  
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

resource "aws_iam_policy" "lambda_policy" {
  name = "execute-iac-lambda-policy"
  
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
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.aws_keys_table.arn,
          aws_dynamodb_table.iac_scripts_table.arn,
          "${aws_dynamodb_table.aws_keys_table.arn}/index/*",
          "${aws_dynamodb_table.iac_scripts_table.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# API Gateway
resource "aws_api_gateway_rest_api" "api" {
  name        = "iac-platform-api"
  description = "API for IAC Platform"
}

# User endpoints
resource "aws_api_gateway_resource" "users_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "users"
}

# AWS keys endpoints
resource "aws_api_gateway_resource" "keys_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "keys"
}

# IAC scripts endpoints
resource "aws_api_gateway_resource" "scripts_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "scripts"
}

# Execute endpoint
resource "aws_api_gateway_resource" "execute_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "execute"
}

# Route53 configuration for custom domain
resource "aws_route53_zone" "main" {
  name = "getmemap.com"
}

# Route53 record removed - using CloudFront default domain name instead

# CloudFront distribution for HTTPS
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id   = "S3-ssp-getmemap-com"
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-ssp-getmemap-com"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# SSL Certificate removed - using CloudFront default certificate instead
