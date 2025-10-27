# 🚀 快速部署指南

## 🎯 选择你的部署方式

### 🆕 方式一：一键部署（新用户推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess&env=AI_PROVIDER,OPENAI_API_KEY,AI_MODEL,NEXTAUTH_SECRET&envDescription=AI%20service%20configuration%20and%20authentication%20secrets&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess%23environment-variables&project-name=drawguess&repository-name=drawguess)

**适合人群**：第一次接触项目，想要快速体验
**优点**：全自动化，无需手动配置
**注意**：会在你的 GitHub 创建仓库副本

### 👨‍💻 方式二：导入现有仓库（开发者推荐）

**适合人群**：已经 fork/clone 了仓库，想要部署现有代码
**优点**：使用现有仓库，不创建副本

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 点击 "Import Git Repository"
3. 授权并选择你的仓库
4. **重要**：设置 Root Directory 为 `DrawGuess`
5. 配置环境变量
6. 点击 Deploy

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

### ⚡ 方式三：脚本部署（自动化推荐）

**适合人群**：喜欢自动化，想要本地控制部署流程

```bash
# 1. 进入项目目录
cd DrawGuess

# 2. 安装依赖
npm install

# 3. 设置环境变量（交互式）
./scripts/setup-env.sh

# 4. 执行部署
./scripts/deploy.sh
```

### 🛠️ 方式四：手动部署（完全控制）

**适合人群**：需要完全控制每个步骤的高级用户

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 进入项目目录并初始化
cd DrawGuess
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

## 🤔 如何选择部署方式？

| 情况 | 推荐方式 | 原因 |
|------|----------|------|
| 第一次使用，想快速体验 | 方式一：一键部署 | 全自动，无需配置 |
| 已有仓库，想部署现有代码 | 方式二：导入仓库 | 不创建副本，使用现有代码 |
| 需要自动化脚本 | 方式三：脚本部署 | 可重复执行，适合 CI/CD |
| 需要完全控制 | 方式四：手动部署 | 每步可控，适合调试 |

## 📋 详细步骤说明

### 方式一：一键部署详细步骤

1. **点击部署按钮** ⬆️
2. **GitHub 授权** - 首次使用需要授权 Vercel 访问 GitHub
3. **仓库配置** - Vercel 会创建仓库副本到你的账户
4. **项目检测** - 自动识别为 Next.js 项目
5. **环境变量配置**：
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   AI_MODEL=gpt-4-vision-preview
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```
6. **部署执行** - 点击 Deploy，等待完成
7. **获取域名** - 部署成功后获得 `.vercel.app` 域名

### 方式二：导入仓库详细步骤

1. **准备仓库** - 确保代码已推送到 GitHub
2. **访问 Vercel** - 前往 [vercel.com/new](https://vercel.com/new)
3. **选择导入** - 点击 "Import Git Repository"
4. **授权 GitHub** - 如果未授权，先完成 GitHub 集成
5. **选择仓库** - 从列表中找到你的仓库
6. **配置根目录** - **重要**：设置 Root Directory 为 `DrawGuess`
7. **框架检测** - Vercel 自动检测为 Next.js
8. **环境变量** - 添加必需的环境变量
9. **开始部署** - 点击 Deploy 按钮

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