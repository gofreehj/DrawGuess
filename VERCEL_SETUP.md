# Vercel 部署配置指南

## 🎯 部署方式对比

| 特性 | 一键部署 | 导入现有仓库 | CLI 部署 |
|------|----------|--------------|----------|
| **适用场景** | 新用户快速体验 | 开发者部署现有代码 | 高级用户完全控制 |
| **GitHub 仓库** | 自动创建副本 | 使用现有仓库 | 使用现有仓库 |
| **配置复杂度** | 🟢 简单 | 🟡 中等 | 🔴 复杂 |
| **自定义程度** | 🔴 低 | 🟡 中等 | 🟢 高 |
| **后续维护** | 🟡 中等 | 🟢 简单 | 🟢 简单 |

## 🚀 方式一：一键部署

### 优点
- ✅ 零配置，点击即用
- ✅ 自动创建完整的项目结构
- ✅ 引导式环境变量设置
- ✅ 适合快速演示和测试

### 缺点
- ❌ 会创建仓库副本
- ❌ 需要管理两个仓库（原始 + 副本）
- ❌ 自定义选项有限

### 使用步骤
1. 点击一键部署按钮
2. 授权 GitHub 访问
3. 配置项目名称和仓库名
4. 设置环境变量
5. 等待部署完成

### 后续管理
```bash
# 如果需要修改代码，在创建的副本仓库中操作
git clone https://github.com/your-username/drawguess-copy.git
cd drawguess-copy
# 修改代码后推送，Vercel 会自动重新部署
git add .
git commit -m "Update code"
git push
```

## 👨‍💻 方式二：导入现有仓库（推荐）

### 优点
- ✅ 使用现有仓库，无副本
- ✅ 完全控制代码和版本
- ✅ 支持团队协作
- ✅ 可以自定义构建配置

### 缺点
- ❌ 需要手动配置根目录
- ❌ 需要了解项目结构

### 详细步骤

#### 1. 准备阶段
```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Vercel 配置
1. 访问 [vercel.com/new](https://vercel.com/new)
2. 点击 "Import Git Repository"
3. 如果没有看到仓库，点击 "Adjust GitHub App Permissions"
4. 选择你的仓库

#### 3. 项目配置
```
Project Name: drawguess (或你喜欢的名称)
Framework Preset: Next.js (自动检测)
Root Directory: DrawGuess (重要！)
Build Command: npm run build (自动填充)
Output Directory: .next (自动填充)
Install Command: npm install (自动填充)
```

#### 4. 环境变量配置
在 "Environment Variables" 部分添加：
```
AI_PROVIDER = openai
OPENAI_API_KEY = sk-your-key-here
AI_MODEL = gpt-4-vision-preview
NEXTAUTH_SECRET = your-random-secret
NEXTAUTH_URL = https://your-app.vercel.app
```

#### 5. 部署
点击 "Deploy" 按钮，等待部署完成。

### 后续管理
```bash
# 直接在原仓库中修改代码
cd your-original-repo/DrawGuess
# 修改代码
git add .
git commit -m "Update feature"
git push origin main
# Vercel 会自动检测并重新部署
```

## ⚡ 方式三：CLI 部署

### 优点
- ✅ 完全控制部署流程
- ✅ 支持脚本自动化
- ✅ 可以集成到 CI/CD 流程
- ✅ 支持多环境部署

### 安装和配置
```bash
# 1. 安装 Vercel CLI
npm install -g vercel@latest

# 2. 登录 Vercel
vercel login

# 3. 进入项目目录
cd DrawGuess

# 4. 初始化项目（首次）
vercel

# 按提示选择：
# ? Set up and deploy "~/path/to/DrawGuess"? [Y/n] y
# ? Which scope do you want to deploy to? Your Name
# ? Link to existing project? [y/N] n
# ? What's your project's name? drawguess
# ? In which directory is your code located? ./
```

### 环境变量管理
```bash
# 添加生产环境变量
vercel env add AI_PROVIDER production
vercel env add OPENAI_API_KEY production
vercel env add AI_MODEL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# 查看环境变量
vercel env ls

# 删除环境变量
vercel env rm VARIABLE_NAME production
```

### 部署命令
```bash
# 预览部署（测试）
vercel

# 生产部署
vercel --prod

# 查看部署状态
vercel ls

# 查看部署日志
vercel logs
```

## 🔧 高级配置

### 自定义域名
```bash
# 添加域名
vercel domains add your-domain.com

# 将域名分配给项目
vercel alias set your-app.vercel.app your-domain.com
```

### 环境特定配置
```bash
# 开发环境
vercel env add NEXT_PUBLIC_API_URL development
# 预览环境  
vercel env add NEXT_PUBLIC_API_URL preview
# 生产环境
vercel env add NEXT_PUBLIC_API_URL production
```

### 团队协作
```bash
# 邀请团队成员
vercel teams invite user@example.com

# 切换团队
vercel switch
```

## 🚨 常见问题解决

### 问题 1：Root Directory 设置错误
**现象**：部署失败，提示找不到 package.json
**解决**：确保 Root Directory 设置为 `DrawGuess`

### 问题 2：数据库初始化失败
**现象**：API 返回 "No prompts available in the database"
**解决**：
- 检查 `/api/health` 端点确认数据库状态
- 确保应用已正确部署最新代码
- Vercel 使用内存数据库，每次冷启动会自动初始化

### 问题 3：环境变量未生效
**现象**：应用运行但功能异常
**解决**：
```bash
# 检查环境变量
vercel env ls
# 重新部署
vercel --prod
```

### 问题 4：构建失败
**现象**：TypeScript 或 ESLint 错误
**解决**：
```bash
# 本地测试构建
npm run build
# 修复错误后重新部署
```

### 问题 5：函数超时
**现象**：API 请求超时
**解决**：检查 `vercel.json` 中的函数配置：
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 问题 6：区域配置错误
**现象**：部署时提示 "Invalid region selector"
**解决**：移除 `vercel.json` 中的 `regions` 配置，让 Vercel 自动选择最优区域：
```json
{
  "version": 2,
  "name": "drawguess"
  // 移除 regions 配置
}
```

## 📊 部署后验证

### 健康检查
```bash
# 检查应用状态和数据库
curl https://your-app.vercel.app/api/health

# 预期响应
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "type": "memory",
      "isServerless": true,
      "promptsCount": 24,
      "hasMinimumPrompts": true
    }
  }
}
```

### 功能验证
```bash
# 测试随机提示词
curl https://your-app.vercel.app/api/prompts/random

# 测试所有提示词
curl https://your-app.vercel.app/api/prompts

# 测试游戏开始
curl -X POST https://your-app.vercel.app/api/game/start
```

### 性能监控
1. 启用 Vercel Analytics
2. 配置 Speed Insights
3. 设置错误监控

### 安全检查
1. 验证环境变量安全性
2. 检查 API 端点访问控制
3. 确认 HTTPS 正常工作

## 🔄 维护和更新

### 定期任务
- 检查依赖更新：`npm audit`
- 监控性能指标
- 备份环境变量配置
- 检查域名和证书状态

### 更新流程
1. 本地开发和测试
2. 推送到 GitHub
3. Vercel 自动部署
4. 验证部署结果
5. 监控应用状态