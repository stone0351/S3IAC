# CloudFront Distribution for S3 Website
# 这是一个占位符配置，用于保持对现有 CloudFront 分发的引用
# 实际配置已经在 AWS Console 中手动管理
# Terraform 将不会更改这个资源，但会将其保留在状态中

resource "aws_cloudfront_distribution" "s3_distribution" {
  # 以下是最小配置，足以让 Terraform 保留此资源
  enabled             = true
  
  origin {
    domain_name = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website_bucket.id}"
    
    # 这是最小必需配置
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website_bucket.id}"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "allow-all"
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
  
  # 最重要的部分：防止 Terraform 更改此资源
  lifecycle {
    ignore_changes = all
  }
}
