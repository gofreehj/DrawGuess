#!/bin/bash

# DrawGuess 环境变量设置脚本
# 用于快速设置 Vercel 环境变量

set -e

echo "🔧 设置 DrawGuess 环境变量..."

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

echo "请输入以下环境变量值:"

# AI 服务配置
read -p "AI_PROVIDER (openai/gemini): " AI_PROVIDER
read -p "OPENAI_API_KEY: " OPENAI_API_KEY
read -p "AI_MODEL (默认: gpt-4-vision-preview): " AI_MODEL
AI_MODEL=${AI_MODEL:-gpt-4-vision-preview}

# 认证配置
read -p "NEXTAUTH_SECRET (留空自动生成): " NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "生成的 NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
fi

read -p "NEXTAUTH_URL (你的应用 URL): " NEXTAUTH_URL

# 可选配置
read -p "GEMINI_API_KEY (如果使用 Gemini，可选): " GEMINI_API_KEY
read -p "NEXT_PUBLIC_APP_NAME (默认: DrawGuess): " APP_NAME
APP_NAME=${APP_NAME:-DrawGuess}

echo "🚀 开始设置环境变量..."

# 设置必需的环境变量
vercel env add AI_PROVIDER production <<< "$AI_PROVIDER"
vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"
vercel env add AI_MODEL production <<< "$AI_MODEL"
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL"

# 设置可选的环境变量
if [ ! -z "$GEMINI_API_KEY" ]; then
    vercel env add GEMINI_API_KEY production <<< "$GEMINI_API_KEY"
fi

vercel env add NEXT_PUBLIC_APP_NAME production <<< "$APP_NAME"
vercel env add NEXT_PUBLIC_MAX_DRAWING_SIZE production <<< "1024"
vercel env add DATABASE_PATH production <<< "./data/game.db"
vercel env add RATE_LIMIT_MAX_REQUESTS production <<< "100"
vercel env add RATE_LIMIT_WINDOW_MS production <<< "900000"

echo "✅ 环境变量设置完成！"
echo "📋 查看所有环境变量: vercel env ls"
echo "🚀 现在可以部署应用: npm run deploy:vercel"