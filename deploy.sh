#!/bin/bash

# Exit on error
set -e

# Define variables
S3_BUCKET="ssp-getmemap-com"
REGION="us-east-1"
FRONTEND_DIR="./frontend"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "Terraform is not installed. Please install it first."
    exit 1
fi

# Deploy backend infrastructure with Terraform
echo "Deploying backend infrastructure..."
cd terraform
terraform init
terraform apply -auto-approve
cd ..

# Build lambda functions
echo "Building Lambda functions..."
cd backend/lambda
npm install
npm run build
cd ../..

# Deploy frontend to S3
echo "Deploying frontend to S3..."
aws s3 sync $FRONTEND_DIR s3://$S3_BUCKET --region $REGION --delete

echo "Deployment complete!"
echo "Your website will be available at https://ssp.getmemap.com"
echo "Note: It may take a few minutes for the CloudFront distribution to update."
