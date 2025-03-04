#!/bin/bash
# 构建 Lambda 函数部署包脚本

echo "开始构建 Lambda 函数部署包..."

# 确保我们在脚本所在目录
cd "$(dirname "$0")"

# 安装依赖（如果需要）
echo "安装 npm 依赖..."
npm install

# 构建 execute_iac_lambda.zip
echo "构建 execute_iac Lambda 包..."
zip -r execute_iac_lambda.zip execute_iac.js node_modules

# 构建 api_handlers_lambda.zip
echo "构建 API handlers Lambda 包..."
zip -r api_handlers_lambda.zip api_handlers.js node_modules

echo "Lambda 部署包构建完成!"
