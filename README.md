# 绘画猜测游戏 (Drawing Guessing Game)

一个基于 Next.js 的交互式绘画猜测游戏，用户根据提示词绘画，AI 来猜测画的内容。

## 🚀 快速部署

### 🎯 选择适合你的部署方式

#### 🆕 新用户 - 一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess&env=AI_PROVIDER,OPENAI_API_KEY,AI_MODEL,NEXTAUTH_SECRET&envDescription=AI%20service%20configuration%20and%20authentication%20secrets&project-name=drawguess&repository-name=drawguess)

**适用场景**：第一次使用，想要快速体验
- ✅ 自动创建 GitHub 仓库副本
- ✅ 自动配置项目设置
- ✅ 引导式环境变量配置

#### 👨‍💻 开发者 - 导入现有仓库
**适用场景**：已有仓库，想要部署现有代码

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 点击 "Import Git Repository"
3. 选择你的 DrawGuess 仓库
4. 设置 Root Directory 为 `DrawGuess`
5. 配置环境变量并部署

#### ⚡ 极客 - 命令行部署
**适用场景**：喜欢命令行，需要完全控制

```bash
cd DrawGuess
npm install -g vercel
vercel login
vercel --prod
```

📖 **详细指南**：
- [🚀 快速部署指南](./QUICK_DEPLOY.md) - 3分钟快速上手
- [⚙️ Vercel 配置指南](./VERCEL_SETUP.md) - 部署方式对比和详细配置
- [📋 完整部署文档](./DEPLOYMENT.md) - 多平台部署说明

## 功能特性

- 🎨 HTML5 Canvas 绘画界面
- 🤖 AI 图像识别和猜测
- 📊 游戏历史记录
- 🎯 多种动物提示词
- 📱 响应式设计，支持移动端

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **绘画**: HTML5 Canvas API, Fabric.js
- **数据库**: SQLite (better-sqlite3)
- **AI 服务**: OpenAI 兼容 API
- **部署**: Vercel (推荐)

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── game/         # 游戏相关 API
│   │   ├── prompts/      # 提示词 API
│   │   └── history/      # 历史记录 API
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 主页
├── components/            # React 组件
│   ├── GameBoard.tsx     # 游戏主界面
│   ├── DrawingCanvas.tsx # 绘画画布
│   ├── PromptDisplay.tsx # 提示词显示
│   └── ResultDisplay.tsx # 结果显示
├── lib/                  # 工具库
│   ├── database.ts       # 数据库操作
│   └── ai-service.ts     # AI 服务
└── types/                # TypeScript 类型定义
    └── game.ts           # 游戏相关类型
```

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 到 `.env.local` 并配置：

```bash
cp .env.example .env.local
```

配置必要的环境变量：
- `OPENAI_API_KEY`: OpenAI API 密钥
- `OPENAI_API_URL`: API 端点 URL
- `AI_MODEL`: 使用的 AI 模型

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## API 接口

### 游戏管理
- `POST /api/game/start` - 开始新游戏
- `POST /api/game/submit` - 提交绘画

### 提示词管理
- `GET /api/prompts/random` - 获取随机提示词
- `GET /api/prompts` - 获取所有提示词

### 历史记录
- `GET /api/history` - 获取游戏历史
- `GET /api/history/:gameId` - 获取单个游戏详情

## 部署

### 🚀 部署到 Vercel（推荐）

#### 方式一：直接导入现有仓库（推荐）

1. **访问 Vercel** - 前往 [vercel.com/new](https://vercel.com/new)
2. **导入仓库** - 点击 "Import Git Repository"
3. **选择仓库** - 找到并选择你的 DrawGuess 仓库
4. **配置根目录** - 设置 Root Directory 为 `DrawGuess`
5. **自动检测** - Vercel 会自动检测这是一个 Next.js 项目
6. **配置环境变量** - 添加必需的环境变量（见下表）
7. **部署** - 点击 "Deploy" 开始部署

#### 方式二：一键部署模板

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fdrawguess&env=AI_PROVIDER,OPENAI_API_KEY,AI_MODEL,NEXTAUTH_SECRET&envDescription=AI%20service%20configuration%20and%20authentication%20secrets&project-name=drawguess&repository-name=drawguess)

> ⚠️ 注意：此方式会创建仓库副本，如果你已有仓库，推荐使用方式一

#### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `AI_PROVIDER` | AI 服务提供商 | `openai` 或 `gemini` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-...` |
| `AI_MODEL` | 使用的 AI 模型 | `gpt-4-vision-preview` |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 随机生成的字符串 |
| `NEXTAUTH_URL` | 应用 URL | `https://your-app.vercel.app` |

#### 可选的环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `GEMINI_API_KEY` | Gemini API 密钥（如果使用 Gemini） | - |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `DrawGuess` |
| `NEXT_PUBLIC_MAX_DRAWING_SIZE` | 最大绘画尺寸 | `1024` |
| `RATE_LIMIT_MAX_REQUESTS` | 速率限制请求数 | `100` |
| `RATE_LIMIT_WINDOW_MS` | 速率限制时间窗口 | `900000` |

5. **完成部署** - 点击 "Deploy" 按钮，等待部署完成
6. **访问应用** - 部署完成后，你将获得一个 `.vercel.app` 域名来访问你的应用

### 手动部署到 Vercel

如果你想要更多控制，也可以手动部署：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel

# 设置环境变量
vercel env add AI_PROVIDER
vercel env add OPENAI_API_KEY
vercel env add AI_MODEL
vercel env add NEXTAUTH_SECRET

# 重新部署以应用环境变量
vercel --prod
```

### 其他平台部署

项目也支持部署到其他平台：

#### Netlify
1. 连接 GitHub 仓库
2. 设置构建命令：`npm run build`
3. 设置发布目录：`.next`
4. 配置环境变量

#### Railway
1. 连接 GitHub 仓库
2. Railway 会自动检测 Next.js 项目
3. 配置环境变量
4. 部署

#### 自托管
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 部署后配置

部署完成后，建议进行以下配置：

1. **自定义域名** - 在 Vercel 控制台中添加自定义域名
2. **环境变量验证** - 访问 `/api/health` 检查配置是否正确
3. **性能监控** - 启用 Vercel Analytics 和 Speed Insights
4. **错误追踪** - 配置 Sentry 进行错误监控

## 开发状态

当前项目处于初始化阶段，基础架构已搭建完成。后续开发任务：

1. ✅ 项目初始化和基础设置
2. ⏳ 数据库设计和初始化
3. ⏳ 提示词系统实现
4. ⏳ 绘画画布组件开发
5. ⏳ AI 识别服务集成
6. ⏳ 游戏会话管理
7. ⏳ 前端用户界面开发
8. ⏳ 游戏历史功能
9. ⏳ 错误处理和用户体验优化
10. ⏳ 应用集成和部署准备

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License