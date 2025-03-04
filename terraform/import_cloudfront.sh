#!/bin/bash

# 确保执行目录正确
cd "$(dirname "$0")"

# 导入现有的 CloudFront 分发到 Terraform 状态
# 替换 E3DPAY9OYNV23I 为您的 CloudFront 分发 ID
terraform import aws_cloudfront_distribution.s3_distribution E3DPAY9OYNV23I

echo "CloudFront 分发已导入 Terraform 状态"
