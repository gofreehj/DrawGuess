#!/bin/bash

# DrawGuess 部署方式选择器
# 帮助用户选择最适合的部署方式

set -e

echo "🎯 DrawGuess 部署方式选择器"
echo "================================"
echo ""

# 询问用户情况
echo "请回答几个问题，我们为你推荐最适合的部署方式："
echo ""

read -p "1. 这是你第一次部署这个项目吗？(y/n): " first_time
read -p "2. 你已经有这个项目的 GitHub 仓库了吗？(y/n): " has_repo
read -p "3. 你熟悉命令行操作吗？(y/n): " cli_familiar
read -p "4. 你需要频繁修改和部署代码吗？(y/n): " frequent_deploy

echo ""
echo "🤔 分析中..."
echo ""

# 根据回答推荐部署方式
if [[ "$first_time" == "y" && "$has_repo" == "n" ]]; then
    echo "🆕 推荐：一键部署"
    echo "原因：你是新用户，一键部署最简单快捷"
    echo ""
    echo "📋 操作步骤："
    echo "1. 点击 README 中的 'Deploy with Vercel' 按钮"
    echo "2. 按提示配置环境变量"
    echo "3. 等待部署完成"
    echo ""
    echo "🔗 详细指南：./QUICK_DEPLOY.md"
    
elif [[ "$has_repo" == "y" && "$frequent_deploy" == "y" ]]; then
    echo "👨‍💻 推荐：导入现有仓库"
    echo "原因：你有现有仓库且需要频繁部署，这样最方便维护"
    echo ""
    echo "📋 操作步骤："
    echo "1. 访问 https://vercel.com/new"
    echo "2. 选择 'Import Git Repository'"
    echo "3. 选择你的仓库，设置 Root Directory 为 'DrawGuess'"
    echo "4. 配置环境变量并部署"
    echo ""
    echo "🔗 详细指南：./VERCEL_SETUP.md"
    
elif [[ "$cli_familiar" == "y" ]]; then
    echo "⚡ 推荐：命令行部署"
    echo "原因：你熟悉命令行，可以获得最大的控制权"
    echo ""
    echo "📋 操作步骤："
    echo "1. npm install -g vercel"
    echo "2. vercel login"
    echo "3. cd DrawGuess && vercel"
    echo "4. 配置环境变量：vercel env add"
    echo "5. 生产部署：vercel --prod"
    echo ""
    echo "🔗 详细指南：./VERCEL_SETUP.md"
    
else
    echo "🎯 推荐：导入现有仓库"
    echo "原因：平衡了简单性和控制性，适合大多数用户"
    echo ""
    echo "📋 操作步骤："
    echo "1. 确保代码已推送到 GitHub"
    echo "2. 访问 https://vercel.com/new"
    echo "3. 导入你的仓库"
    echo "4. 设置 Root Directory 为 'DrawGuess'"
    echo "5. 配置环境变量并部署"
    echo ""
    echo "🔗 详细指南：./VERCEL_SETUP.md"
fi

echo ""
echo "💡 小贴士："
echo "- 所有方式都支持自动重新部署"
echo "- 环境变量可以随时在 Vercel 控制台修改"
echo "- 部署后可以绑定自定义域名"
echo ""

read -p "是否需要查看详细的环境变量配置？(y/n): " show_env

if [[ "$show_env" == "y" ]]; then
    echo ""
    echo "🔧 必需的环境变量："
    echo "================================"
    echo "AI_PROVIDER=openai"
    echo "OPENAI_API_KEY=sk-your-key-here"
    echo "AI_MODEL=gpt-4-vision-preview"
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-random-secret-here')"
    echo "NEXTAUTH_URL=https://your-app.vercel.app"
    echo ""
    echo "📖 完整环境变量说明请查看：./QUICK_DEPLOY.md"
fi

echo ""
echo "🚀 准备好部署了吗？祝你部署顺利！"