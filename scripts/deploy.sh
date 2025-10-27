#!/bin/bash

# DrawGuess 部署脚本
# 用于自动化部署到 Vercel

set -e

echo "🚀 开始部署 DrawGuess 到 Vercel..."

# 检查是否安装了必要的工具
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel@latest
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查环境变量
echo "🔍 检查环境变量..."
if [ -z "$VERCEL_TOKEN" ]; then
    echo "⚠️  VERCEL_TOKEN 环境变量未设置"
    echo "请运行: export VERCEL_TOKEN=your_token_here"
    echo "或者手动登录: vercel login"
fi

# 运行预部署检查
echo "🔍 运行预部署检查..."
npm run deploy:check

# 询问部署类型
echo "请选择部署类型:"
echo "1) 预览部署 (Preview)"
echo "2) 生产部署 (Production)"
read -p "请输入选择 (1 或 2): " choice

case $choice in
    1)
        echo "📦 开始预览部署..."
        npm run deploy:preview
        ;;
    2)
        echo "🚀 开始生产部署..."
        npm run deploy:vercel
        ;;
    *)
        echo "❌ 无效选择，退出"
        exit 1
        ;;
esac

echo "✅ 部署完成！"
echo "📊 查看部署状态: vercel ls"
echo "📝 查看日志: vercel logs"