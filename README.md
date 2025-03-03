# AWS IAC Website

This project creates a web application hosted on AWS S3, with the following features:
- Google account authentication
- Secure storage of AWS account keys in DynamoDB
- Storage and execution of Infrastructure as Code (IAC)
- Lambda function for executing IAC code

## Project Structure
- `frontend/`: Contains all the static website files (HTML, CSS, JS)
- `backend/`: Contains Lambda functions and API definitions
- `terraform/`: Contains infrastructure as code for deploying the application

## Features
1. Google account registration and login
2. AWS key management
3. IAC code storage and execution
4. Security measures to protect AWS keys

## Setup Instructions
1. Deploy the backend infrastructure using Terraform
2. Configure the S3 bucket for static website hosting
3. Set up the DynamoDB tables
4. Deploy the Lambda functions
5. Configure the custom domain (ssp.getmemap.com)
