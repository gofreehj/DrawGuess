# 🚀 快速部署指南

## 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess&env=AI_PROVIDER,OPENAI_API_KEY,AI_MODEL,NEXTAUTH_SECRET&envDescription=AI%20service%20configuration%20and%20authentication%20secrets&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess%23environment-variables&project-name=drawguess&repository-name=drawguess)

## 📋 部署前准备

### 1. 获取 API 密钥

**OpenAI API 密钥**
1. 访问 [OpenAI API Keys](https://platform.openai.com/api-keys)
2. 创建新的 API 密钥
3. 复制密钥（格式：`sk-...`）

**或者 Gemini API 密钥**
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API 密钥
3. 复制密钥

### 2. 生成认证密钥

```bash
# 生成随机密钥
openssl rand -base64 32

# 或者使用在线工具
# https://generate-secret.vercel.app/32
```

## ⚡ 三种部署方式

### 方式一：一键部署（推荐新手）

1. **点击部署按钮** ⬆️
2. **连接 GitHub** - 授权 Vercel 访问
3. **配置环境变量**：
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   AI_MODEL=gpt-4-vision-preview
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```
4. **点击 Deploy** - 等待部署完成
5. **访问应用** - 获得 `.vercel.app` 域名

### 方式二：脚本部署（推荐开发者）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/drawguess.git
cd drawguess/DrawGuess

# 2. 安装依赖
npm install

# 3. 设置环境变量（交互式）
./scripts/setup-env.sh

# 4. 部署
./scripts/deploy.sh
```

### 方式三：手动部署（完全控制）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 初始化项目
vercel

# 4. 设置环境变量
vercel env add AI_PROVIDER
vercel env add OPENAI_API_KEY
vercel env add AI_MODEL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# 5. 生产部署
vercel --prod
```

## 🔧 环境变量说明

| 变量 | 必需 | 说明 | 示例 |
|------|------|------|------|
| `AI_PROVIDER` | ✅ | AI 服务商 | `openai` 或 `gemini` |
| `OPENAI_API_KEY` | ✅* | OpenAI 密钥 | `sk-proj-...` |
| `GEMINI_API_KEY` | ✅* | Gemini 密钥 | `AIza...` |
| `AI_MODEL` | ✅ | AI 模型 | `gpt-4-vision-preview` |
| `NEXTAUTH_SECRET` | ✅ | 认证密钥 | 32字符随机字符串 |
| `NEXTAUTH_URL` | ✅ | 应用 URL | `https://your-app.vercel.app` |

*根据选择的 AI_PROVIDER 设置对应的 API 密钥

## ✅ 部署验证

部署完成后访问：
- **主页**: `https://your-app.vercel.app`
- **健康检查**: `https://your-app.vercel.app/api/health`
- **API 测试**: `https://your-app.vercel.app/api/prompts/random`

## 🚨 常见问题

### 部署失败
- 检查环境变量是否正确设置
- 确认 API 密钥有效且有足够额度
- 查看 Vercel 部署日志

### API 调用失败
- 验证 API 密钥格式正确
- 检查 API 服务商账户状态
- 确认模型名称正确

### 应用无法访问
- 检查 NEXTAUTH_URL 是否与实际域名匹配
- 确认所有必需环境变量已设置

## 📞 获取帮助

- 📖 [完整部署文档](./DEPLOYMENT.md)
- 🐛 [GitHub Issues](https://github.com/your-username/drawguess/issues)
- 📚 [Vercel 文档](https://vercel.com/docs)

---

**🎉 部署成功后，你就可以开始享受绘画猜测游戏了！**