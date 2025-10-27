#!/bin/bash

# 设置 Vercel Secrets 脚本
# 用于创建 Vercel Secrets 并使用 vercel.secrets.json 配置

set -e

echo "🔐 设置 Vercel Secrets..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel@latest
fi

# 登录检查
echo "🔍 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "请先登录 Vercel:"
    vercel login
fi

echo "📝 请输入以下环境变量值来创建 Vercel Secrets:"
echo "注意：Secrets 一旦创建就无法查看，只能更新或删除"
echo ""

# 创建 Secrets
echo "🔑 创建 AI 服务配置 Secrets..."
read -p "AI_PROVIDER (openai/gemini): " AI_PROVIDER
echo "$AI_PROVIDER" | vercel secrets add ai_provider

read -p "OPENAI_API_KEY: " OPENAI_API_KEY
echo "$OPENAI_API_KEY" | vercel secrets add openai_api_key

read -p "AI_MODEL (默认: gpt-4-vision-preview): " AI_MODEL
AI_MODEL=${AI_MODEL:-gpt-4-vision-preview}
echo "$AI_MODEL" | vercel secrets add ai_model

# 可选的 Gemini 配置
read -p "GEMINI_API_KEY (可选，如果使用 Gemini): " GEMINI_API_KEY
if [ ! -z "$GEMINI_API_KEY" ]; then
    echo "$GEMINI_API_KEY" | vercel secrets add gemini_api_key
fi

# 认证配置
read -p "NEXTAUTH_SECRET (留空自动生成): " NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "生成的 NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
fi
echo "$NEXTAUTH_SECRET" | vercel secrets add nextauth_secret

read -p "NEXTAUTH_URL (你的应用 URL): " NEXTAUTH_URL
echo "$NEXTAUTH_URL" | vercel secrets add nextauth_url

# 应用配置
read -p "NEXT_PUBLIC_APP_NAME (默认: DrawGuess): " APP_NAME
APP_NAME=${APP_NAME:-DrawGuess}
echo "$APP_NAME" | vercel secrets add next_public_app_name

# 其他配置
echo "https://api.openai.com/v1" | vercel secrets add openai_api_url
echo "https://generativelanguage.googleapis.com/v1beta" | vercel secrets add gemini_api_url
echo "./data/game.db" | vercel secrets add database_path
echo "1024" | vercel secrets add next_public_max_drawing_size
echo "false" | vercel secrets add next_public_enable_analytics
echo "" | vercel secrets add next_public_sentry_dsn
echo "100" | vercel secrets add rate_limit_max_requests
echo "900000" | vercel secrets add rate_limit_window_ms
echo "https://your-domain.com" | vercel secrets add allowed_origins

echo ""
echo "✅ Vercel Secrets 创建完成！"
echo ""
echo "📋 下一步："
echo "1. 将 vercel.secrets.json 重命名为 vercel.json:"
echo "   mv vercel.secrets.json vercel.json"
echo ""
echo "2. 部署应用:"
echo "   vercel --prod"
echo ""
echo "🔍 查看所有 Secrets:"
echo "   vercel secrets ls"
echo ""
echo "⚠️  注意：使用 Secrets 后，环境变量将无法在 Vercel 控制台中直接查看和修改"
echo "   如需修改，请使用: vercel secrets add secret_name"