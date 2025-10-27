# 部署指南 (Deployment Guide)

本文档详细介绍了如何将 DrawGuess 绘画猜测游戏部署到各种平台。

## 🚀 快速部署

### Vercel 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess&env=AI_PROVIDER,OPENAI_API_KEY,AI_MODEL,NEXTAUTH_SECRET&envDescription=AI%20service%20configuration%20and%20authentication%20secrets&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess%23environment-variables&project-name=drawguess&repository-name=drawguess)

点击上方按钮，按照提示完成部署。

## 📋 环境变量配置

### 必需变量

```bash
# AI 服务配置
AI_PROVIDER=openai                    # 或 'gemini'
OPENAI_API_KEY=sk-your-key-here      # OpenAI API 密钥
AI_MODEL=gpt-4-vision-preview        # AI 模型

# 认证配置
NEXTAUTH_SECRET=your-secret-here     # 随机生成的密钥
NEXTAUTH_URL=https://your-app.vercel.app  # 你的应用 URL
```

### 可选变量

```bash
# Gemini 配置（如果使用）
GEMINI_API_KEY=your-gemini-key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta

# 应用配置
NEXT_PUBLIC_APP_NAME=DrawGuess
NEXT_PUBLIC_MAX_DRAWING_SIZE=1024
DATABASE_PATH=./data/game.db

# 性能和安全
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
ALLOWED_ORIGINS=https://your-domain.com

# 监控和分析
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 🔧 平台特定部署

### Vercel

#### 自动部署
1. Fork 或克隆仓库到你的 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

#### CLI 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 配置环境变量
vercel env add AI_PROVIDER production
vercel env add OPENAI_API_KEY production
vercel env add AI_MODEL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# 生产部署
vercel --prod
```

#### Vercel 配置文件

项目包含 `vercel.json` 配置文件，包含：
- 构建配置
- 环境变量映射
- 函数超时设置
- 安全头配置
- 重定向规则

### Netlify

```bash
# 构建设置
Build command: npm run build
Publish directory: .next

# 环境变量
# 在 Netlify 控制台中设置所有必需的环境变量
```

### Railway

1. 连接 GitHub 仓库
2. Railway 自动检测 Next.js 项目
3. 在设置中添加环境变量
4. 部署

### Docker 部署

```bash
# 构建镜像
docker build -t drawguess .

# 运行容器
docker run -p 3000:3000 \
  -e AI_PROVIDER=openai \
  -e OPENAI_API_KEY=your-key \
  -e AI_MODEL=gpt-4-vision-preview \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  drawguess

# 或使用 docker-compose
docker-compose up -d
```

### 自托管

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动生产服务器
npm start

# 或使用 PM2
npm install -g pm2
pm2 start npm --name "drawguess" -- start
```

## 🔍 部署验证

部署完成后，访问以下端点验证：

```bash
# 健康检查
curl https://your-app.vercel.app/api/health

# API 测试
curl https://your-app.vercel.app/api/prompts/random
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "0.1.0"
}
```

## 🚨 常见问题

### 1. 构建失败

**问题**: TypeScript 编译错误
```bash
# 解决方案
npm run type-check
npm run lint:fix
```

**问题**: 依赖安装失败
```bash
# 清理并重新安装
npm run clean:all
npm install
```

### 2. 运行时错误

**问题**: AI API 调用失败
- 检查 API 密钥是否正确
- 验证 API 端点是否可访问
- 确认模型名称正确

**问题**: 数据库连接失败
- 确保 `DATABASE_PATH` 环境变量正确
- 检查文件权限

### 3. 性能问题

**问题**: 首次加载慢
- 启用 Vercel Edge Functions
- 配置适当的缓存策略
- 优化图片和静态资源

## 📊 监控和维护

### 性能监控

```bash
# Vercel Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Sentry 错误追踪
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 日志监控

```bash
# Vercel 函数日志
vercel logs

# 自托管日志
pm2 logs drawguess
```

### 数据库备份

```bash
# 定期备份数据库
npm run db:backup

# 恢复数据库
cp ./data/backups/game-20240101-120000.db ./data/game.db
```

## 🔄 更新部署

### Vercel 自动部署
- 推送到 main 分支自动触发部署
- 可在 Vercel 控制台查看部署状态

### 手动更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
npm run build
npm start

# 或重新部署到 Vercel
vercel --prod
```

## 🔐 安全最佳实践

1. **环境变量安全**
   - 使用强随机密钥
   - 定期轮换 API 密钥
   - 不要在代码中硬编码密钥

2. **网络安全**
   - 启用 HTTPS
   - 配置适当的 CORS 策略
   - 使用安全头

3. **访问控制**
   - 实施速率限制
   - 监控异常访问
   - 定期审查访问日志

## 📞 支持

如果在部署过程中遇到问题：

1. 检查 [常见问题](#-常见问题) 部分
2. 查看项目的 GitHub Issues
3. 参考 [Next.js 部署文档](https://nextjs.org/docs/deployment)
4. 参考 [Vercel 文档](https://vercel.com/docs)