# Make.com Gemini 图片生成集成模块

[![CI/CD Pipeline](https://github.com/Joseph19820124/make-gemini-image-generator/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/Joseph19820124/make-gemini-image-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

🚀 **专业级Make.com自定义模块** - 为Google Gemini AI添加强大的图片生成功能，支持Imagen 4和Gemini 2.0 Flash的原生图片生成能力。

## 📋 目录

- [问题背景](#问题背景)
- [解决方案](#解决方案)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [API文档](#api文档)
- [部署指南](#部署指南)
- [使用示例](#使用示例)
- [故障排除](#故障排除)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 🔍 问题背景

根据最新调研，Make.com当前的Google Gemini AI集成存在以下限制：

### 现状分析
- ❌ **缺少图片生成功能**：虽然Gemini本身支持强大的图片生成（Imagen 4 + Gemini 2.0 Flash），但Make.com的官方集成尚未包含这些功能
- ❌ **功能受限**：现有集成仅支持3个基础操作，主要用于文本处理
- ❌ **非官方集成**：当前的Gemini集成由Make.com合作伙伴创建，非Google官方

### 用户痛点
1. 无法在Make.com工作流中直接使用Gemini的图片生成能力
2. 需要复杂的第三方API集成才能实现图片生成
3. 缺乏统一的图片处理和批量生成解决方案

## 💡 解决方案

本项目提供**完整、专业的解决方案**，包括：

### 🎨 图片生成功能
- **Imagen 4支持**：高质量文本转图片生成，支持2K分辨率
- **Gemini 2.0 Flash**：原生图片生成，支持多模态输入
- **多种生成模式**：
  - 纯文本描述生成图片
  - 基于上传图片进行编辑
  - 多轮对话式图片优化
  - 故事配图生成

### 🛠️ Make.com原生集成
- **触发器(Triggers)**：图片生成完成触发、批量处理触发
- **动作(Actions)**：生成图片、编辑图片、图片增强、批量图片处理
- **搜索(Searches)**：查询生成历史、获取图片元数据

### 🏗️ 企业级特性
- **高性能**：支持并发处理和批量生成
- **安全可靠**：内置安全检查和内容过滤
- **可扩展**：模块化设计，易于扩展新功能
- **监控完备**：全面的日志记录和错误处理

## 🌟 功能特性

### 核心模块

#### 1. 图片生成模块 (`generate-image`)
```javascript
{
  "prompt": "一只可爱的小猫在樱花树下玩耍，动漫风格，高质量渲染",
  "model": "imagen-4",
  "resolution": "1024x1024",
  "style": "anime",
  "imageCount": 1
}
```

**功能亮点：**
- 支持多种艺术风格（写实、动漫、卡通、油画、水彩、素描）
- 可选分辨率（256x256 到 2048x2048）
- 批量生成（最多4张）
- 种子控制（确保可重现结果）

#### 2. 图片编辑模块 (`edit-image`)
```javascript
{
  "prompt": "将这只猫的颜色改为橙色，并添加一个红色蝴蝶结",
  "inputImage": "base64_image_data",
  "editMode": "inpaint",
  "strength": 0.8
}
```

**编辑模式：**
- **局部重绘 (inpaint)**：修改图片的特定区域
- **扩展绘制 (outpaint)**：扩展图片边界
- **更换元素 (replace)**：更换图片中的特定对象
- **图片增强 (enhance)**：提高图片质量和细节

#### 3. 批量生成模块 (`batch-generate`)
```javascript
{
  "prompts": [
    "一只可爱的小猫",
    "一只狗狗在花丛中",
    "一只在阳光下玩耍的小鸟"
  ],
  "style": "cartoon",
  "maintainConsistency": true
}
```

**批量特性：**
- 最多同时处理10个提示词
- 智能并发控制（避免API限制）
- 风格一致性保持
- 部分成功处理（容错机制）

#### 4. 故事配图模块 (`story-illustration`)
```javascript
{
  "story": "从前有一个勇敢的小公主，她住在一座美丽的城堡里...",
  "illustrationStyle": "storybook",
  "maxIllustrations": 4,
  "characterConsistency": true
}
```

**故事配图特性：**
- 智能故事分析和关键情节提取
- 角色外观一致性保持
- 多种插图风格（童书、写实、卡通等）
- 自动生成故事标题建议

## 🚀 快速开始

### 系统要求
- Node.js 18.0.0 或更高版本
- npm 8.0.0 或更高版本
- Google AI Studio API密钥
- Make.com开发者账户

### 1. 获取API密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 创建新项目并启用Gemini API
3. 生成API密钥
4. 确保启用图片生成功能

### 2. 安装和配置

```bash
# 克隆项目
git clone https://github.com/Joseph19820124/make-gemini-image-generator.git
cd make-gemini-image-generator

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的API密钥

# 运行测试
npm test

# 启动开发服务器
npm run dev
```

### 3. 环境配置示例

```bash
# .env 文件
GOOGLE_AI_API_KEY=your_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_REGION=us-central1
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
MAX_IMAGE_SIZE=10485760
API_RATE_LIMIT=100
```

### 4. Docker部署

```bash
# 构建Docker镜像
docker build -t gemini-image-generator .

# 运行容器
docker run -p 3000:3000 --env-file .env gemini-image-generator

# 或使用docker-compose
docker-compose up -d
```

## 📚 API文档

### 连接配置

#### POST `/connection/test`
验证API连接和权限

**请求体：**
```json
{
  "apiKey": "your_google_ai_api_key",
  "region": "us-central1",
  "projectId": "optional_project_id"
}
```

**响应：**
```json
{
  "status": "success",
  "capabilities": {
    "textGeneration": true,
    "imageGeneration": true,
    "multiModal": true
  },
  "models": {
    "text": ["gemini-2.0-flash-exp", "gemini-1.5-pro"],
    "image": ["gemini-2.0-flash-preview-image-generation"]
  }
}
```

### 图片生成

#### POST `/modules/generate-image/generate`
生成新图片

**请求头：**
```
x-api-key: your_api_key
Content-Type: application/json
```

**请求体：**
```json
{
  "prompt": "一只可爱的小猫在花园里玩耍，油画风格",
  "model": "imagen-4",
  "resolution": "1024x1024",
  "style": "oil-painting",
  "imageCount": 1,
  "quality": "hd",
  "seed": 12345
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "uuid",
        "url": "https://storage.googleapis.com/...",
        "width": 1024,
        "height": 1024,
        "format": "png",
        "downloadUrl": "https://...",
        "thumbnailUrl": "https://...",
        "metadata": {
          "model": "imagen-4",
          "prompt": "一只可爱的小猫...",
          "style": "oil-painting",
          "timestamp": "2025-06-10T14:10:23Z"
        }
      }
    ],
    "usage": {
      "promptTokens": 50,
      "totalTokens": 150
    }
  }
}
```

### 图片编辑

#### POST `/modules/edit-image/edit`
编辑现有图片

**请求：** Multipart form data
- `prompt`: 编辑指令（文本）
- `inputImage`: 输入图片文件
- `editMode`: 编辑模式（inpaint/outpaint/replace/enhance）
- `strength`: 编辑强度（0.1-1.0）
- `maskImage`: 可选蒙版图片

**响应：**
```json
{
  "success": true,
  "data": {
    "editedImage": {
      "id": "uuid",
      "url": "https://storage.googleapis.com/...",
      "width": 1024,
      "height": 1024,
      "metadata": {
        "editPrompt": "将猫的颜色改为橙色",
        "editMode": "inpaint",
        "strength": 0.8
      }
    },
    "usage": {
      "promptTokens": 80,
      "imageTokens": 200,
      "totalTokens": 280
    }
  }
}
```

### 批量生成

#### POST `/modules/batch-generate/batch`
批量生成多张图片

**请求体：**
```json
{
  "prompts": [
    "一只可爱的小猫",
    "一只狗狗在花丛中",
    "一只在阳光下玩耍的小鸟"
  ],
  "model": "gemini-2.0-flash-preview-image-generation",
  "resolution": "1024x1024",
  "style": "cartoon",
  "maintainConsistency": true
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "images": [...],
    "errors": [],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0,
      "totalTokens": 450
    }
  }
}
```

### 故事配图

#### POST `/modules/story-illustration/generate`
为故事生成连续性插图

**请求体：**
```json
{
  "story": "从前有一个勇敢的小公主...",
  "illustrationStyle": "storybook",
  "maxIllustrations": 4,
  "maintainConsistency": true,
  "characterConsistency": true,
  "generateTitle": true
}
```

## 🚢 部署指南

### 生产环境部署

#### 1. 使用Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: gemini-image-generator:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

#### 2. Kubernetes部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gemini-image-generator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gemini-image-generator
  template:
    metadata:
      labels:
        app: gemini-image-generator
    spec:
      containers:
      - name: app
        image: gemini-image-generator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: GOOGLE_AI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secrets
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### 3. 云平台部署

##### Heroku
```bash
# 创建Heroku应用
heroku create your-app-name

# 设置环境变量
heroku config:set GOOGLE_AI_API_KEY=your_key

# 部署
git push heroku main
```

##### Vercel
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### 性能优化

#### 1. 缓存策略
```javascript
// Redis缓存配置
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// 缓存生成结果
const cacheResult = async (key, data, ttl = 3600) => {
  await client.setex(key, ttl, JSON.stringify(data));
};
```

#### 2. 负载均衡
```nginx
# nginx.conf
upstream app_servers {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 💡 使用示例

### Make.com工作流示例

#### 1. 自动生成社交媒体图片
```
触发器: 新的博客文章发布
↓
动作1: 提取文章标题和摘要
↓
动作2: 生成图片
  - 提示词: "{{title}} - {{summary}}, social media style"
  - 风格: professional
  - 分辨率: 1080x1080
↓
动作3: 发布到社交媒体平台
```

#### 2. 电商产品图片生成
```
触发器: 新产品添加到数据库
↓
动作1: 批量生成产品图片
  - 基础提示: "{{product_name}}, professional product photo"
  - 变化: ["white background", "lifestyle setting", "close-up detail"]
↓
动作2: 上传到产品目录
```

#### 3. 故事书配图工作流
```
触发器: 用户提交故事
↓
动作1: 故事分析和配图生成
  - 故事内容: {{story_text}}
  - 风格: storybook
  - 最大插图数: 6
↓
动作2: 生成PDF电子书
↓
动作3: 发送给用户
```

### API集成示例

#### JavaScript/Node.js
```javascript
const axios = require('axios');

class GeminiImageGenerator {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async generateImage(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/modules/generate-image/generate`,
        {
          prompt,
          ...options
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`图片生成失败: ${error.message}`);
    }
  }
}

// 使用示例
const generator = new GeminiImageGenerator('your-api-key', 'http://localhost:3000');

const result = await generator.generateImage(
  '一只可爱的小猫在花园里玩耍',
  {
    style: 'anime',
    resolution: '1024x1024',
    imageCount: 2
  }
);

console.log('生成的图片:', result.data.images);
```

#### Python
```python
import requests
import json

class GeminiImageGenerator:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        
    def generate_image(self, prompt, **options):
        headers = {
            'x-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        data = {
            'prompt': prompt,
            **options
        }
        
        response = requests.post(
            f'{self.base_url}/modules/generate-image/generate',
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f'图片生成失败: {response.text}')

# 使用示例
generator = GeminiImageGenerator('your-api-key', 'http://localhost:3000')

result = generator.generate_image(
    '一只可爱的小猫在花园里玩耍',
    style='anime',
    resolution='1024x1024',
    imageCount=2
)

print('生成的图片:', result['data']['images'])
```

## 🔧 故障排除

### 常见问题

#### 1. API连接失败
**症状：** 返回401错误，提示"API密钥无效"

**解决方案：**
```bash
# 检查API密钥格式
echo $GOOGLE_AI_API_KEY | grep -E '^AIza[0-9A-Za-z-_]{35}$'

# 验证API权限
curl -H "Authorization: Bearer $GOOGLE_AI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

#### 2. 图片生成超时
**症状：** 请求超时，没有返回结果

**解决方案：**
- 检查网络连接
- 减少并发请求数量
- 增加超时时间配置

```javascript
// 增加超时配置
const response = await axios.post(url, data, {
  timeout: 60000, // 60秒超时
  headers: { ... }
});
```

#### 3. 内存不足错误
**症状：** 处理大图片时出现内存错误

**解决方案：**
```javascript
// 在package.json中增加内存限制
{
  "scripts": {
    "start": "node --max-old-space-size=4096 src/index.js"
  }
}
```

#### 4. 频率限制错误
**症状：** 返回429错误，提示"请求过于频繁"

**解决方案：**
- 实现指数退避重试
- 使用队列系统
- 监控API配额使用情况

### 日志分析

#### 启用调试日志
```bash
# 设置调试级别
export DEBUG=gemini:*
export LOG_LEVEL=debug

# 启动服务
npm start
```

#### 日志格式
```json
{
  "level": "info",
  "message": "图片生成成功",
  "timestamp": "2025-06-10T14:10:23.000Z",
  "metadata": {
    "model": "imagen-4",
    "resolution": "1024x1024",
    "duration": 5230,
    "usage": {
      "totalTokens": 150
    }
  }
}
```

### 性能监控

#### 健康检查
```bash
# 检查服务状态
curl http://localhost:3000/health

# 期望响应
{
  "status": "healthy",
  "timestamp": "2025-06-10T14:10:23.000Z",
  "version": "1.0.0"
}
```

#### 监控指标
- API响应时间
- 成功率
- 错误率
- 内存使用量
- CPU使用率
- API配额使用情况

## 🤝 贡献指南

### 开发环境设置

1. **Fork项目**
```bash
git clone https://github.com/yourusername/make-gemini-image-generator.git
cd make-gemini-image-generator
```

2. **安装依赖**
```bash
npm install
```

3. **设置pre-commit钩子**
```bash
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm test"
```

4. **运行测试**
```bash
npm test              # 运行所有测试
npm run test:watch    # 监视模式
npm run test:coverage # 覆盖率报告
```

### 代码规范

#### ESLint配置
```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'plugin:security/recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  }
};
```

#### 提交信息规范
```
type(scope): description

feat(image-gen): 添加批量生成功能
fix(api): 修复连接超时问题
docs(readme): 更新API文档
test(unit): 添加图片处理测试
```

### Pull Request流程

1. **创建功能分支**
```bash
git checkout -b feature/your-feature-name
```

2. **开发和测试**
```bash
# 确保所有测试通过
npm test

# 确保代码格式正确
npm run lint:fix
```

3. **提交代码**
```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

4. **创建Pull Request**
- 提供清晰的标题和描述
- 链接相关的Issue
- 添加测试用例
- 更新文档

### 贡献类型

- 🐛 **Bug修复**：修复现有功能的问题
- ✨ **新功能**：添加新的功能模块
- 📚 **文档**：改进文档和示例
- 🧪 **测试**：增加或改进测试覆盖率
- 🔧 **重构**：代码重构和优化
- 🎨 **UI/UX**：改进用户界面和体验

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 使用条款
- ✅ 商业使用
- ✅ 修改
- ✅ 分发
- ✅ 私人使用
- ❌ 责任
- ❌ 保证

## 🔗 相关链接

- [Make.com 官方文档](https://www.make.com/en/help)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API 文档](https://ai.google.dev/docs)
- [项目 Issues](https://github.com/Joseph19820124/make-gemini-image-generator/issues)
- [项目 Wiki](https://github.com/Joseph19820124/make-gemini-image-generator/wiki)

## 📞 支持和联系

### 获取帮助
- 📖 **文档**：查看[项目Wiki](https://github.com/Joseph19820124/make-gemini-image-generator/wiki)
- 🐛 **Bug报告**：提交[GitHub Issue](https://github.com/Joseph19820124/make-gemini-image-generator/issues/new?template=bug_report.md)
- 💡 **功能请求**：提交[功能请求](https://github.com/Joseph19820124/make-gemini-image-generator/issues/new?template=feature_request.md)
- 💬 **讨论**：参与[GitHub Discussions](https://github.com/Joseph19820124/make-gemini-image-generator/discussions)

### 社区
- 🌟 **Star项目**：如果这个项目对你有帮助
- 🍴 **Fork项目**：创建你自己的版本
- 📢 **分享项目**：让更多人知道这个解决方案

---

**注意**: 此项目为开源解决方案，不隶属于Google或Make.com官方。使用前请确保遵守相关服务条款和API使用限制。

<div align="center">
  <strong>用 ❤️ 为 Make.com 社区开发</strong>
</div>
