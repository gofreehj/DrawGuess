# 绘画猜测游戏 (Drawing Guessing Game)

一个基于 Next.js 的交互式绘画猜测游戏，用户根据提示词绘画，AI 来猜测画的内容。

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

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 其他平台

项目支持任何支持 Node.js 的平台部署。

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