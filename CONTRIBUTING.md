# 贡献指南

欢迎您为 Make.com Gemini 图片生成集成模块项目做出贡献！本文档将指导您完成整个贡献流程。

## 目录

- [贡献类型](#贡献类型)
- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [提交流程](#提交流程)
- [问题报告](#问题报告)
- [功能请求](#功能请求)
- [代码审查](#代码审查)
- [发布流程](#发布流程)

## 贡献类型

我们欢迎以下类型的贡献：

### 🐛 Bug修复
- 修复现有功能的错误
- 改进错误处理和用户体验
- 修复文档中的错误
- 修复测试用例

### ✨ 新功能
- 添加新的图片生成功能
- 实现新的图片编辑选项
- 集成新的AI模型
- 添加新的输出格式

### 📚 文档改进
- 改进API文档
- 添加使用示例
- 翻译文档
- 修正拼写和语法错误

### 🧪 测试增强
- 增加测试覆盖率
- 添加集成测试
- 改进测试性能
- 添加端到端测试

### 🔧 性能优化
- 提高API响应速度
- 优化内存使用
- 改进并发处理
- 减少资源消耗

### 🎨 用户体验
- 改进错误消息
- 优化API接口设计
- 增强配置选项
- 改进日志输出

## 开发环境搭建

### 系统要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 最新版本
- **Docker**: 20.10+ (可选，用于容器化测试)

### 环境搭建步骤

1. **Fork 项目**
   ```bash
   # 在GitHub上fork项目到你的账户
   # 然后克隆你的fork
   git clone https://github.com/your-username/make-gemini-image-generator.git
   cd make-gemini-image-generator
   ```

2. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/Joseph19820124/make-gemini-image-generator.git
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加必要的API密钥
   ```

5. **运行测试**
   ```bash
   npm test
   ```

6. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 开发工具配置

#### VS Code 推荐扩展
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "humao.rest-client"
  ]
}
```

#### 推荐的VS Code设置
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.format.enable": false,
  "typescript.format.enable": false
}
```

## 代码规范

### JavaScript/Node.js 规范

我们使用 ESLint 和 Prettier 来保持代码一致性：

```bash
# 检查代码规范
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 格式化代码
npm run format
```

#### 编码标准

1. **使用ES6+语法**
   ```javascript
   // ✅ 推荐
   const generateImage = async (prompt, options = {}) => {
     const { style = 'realistic', resolution = '1024x1024' } = options;
     // ...
   };
   
   // ❌ 避免
   function generateImage(prompt, options) {
     options = options || {};
     var style = options.style || 'realistic';
     // ...
   }
   ```

2. **错误处理**
   ```javascript
   // ✅ 推荐
   try {
     const result = await apiCall();
     return result;
   } catch (error) {
     logger.error('API调用失败:', error);
     throw new APIError(`操作失败: ${error.message}`);
   }
   
   // ❌ 避免
   apiCall().then(result => {
     return result;
   }).catch(err => {
     console.log(err);
   });
   ```

3. **异步操作**
   ```javascript
   // ✅ 推荐
   const processImages = async (images) => {
     const results = await Promise.all(
       images.map(image => processImage(image))
     );
     return results;
   };
   
   // ❌ 避免
   const processImages = (images, callback) => {
     let processed = 0;
     const results = [];
     images.forEach((image, index) => {
       processImage(image, (err, result) => {
         // callback hell
       });
     });
   };
   ```

### 命名约定

- **变量和函数**: camelCase
  ```javascript
  const imageGenerator = new ImageGenerator();
  const generateStoryIllustrations = async () => {};
  ```

- **常量**: UPPER_SNAKE_CASE
  ```javascript
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const DEFAULT_RESOLUTION = '1024x1024';
  ```

- **类**: PascalCase
  ```javascript
  class GeminiImageGenerator {
    constructor() {}
  }
  ```

- **文件名**: kebab-case
  ```
  generate-image.js
  story-illustration.js
  image-processor.js
  ```

### 注释规范

使用JSDoc格式注释：

```javascript
/**
 * 生成图片
 * @param {string} prompt - 图片描述
 * @param {Object} options - 生成选项
 * @param {string} [options.style='realistic'] - 艺术风格
 * @param {string} [options.resolution='1024x1024'] - 图片分辨率
 * @param {number} [options.imageCount=1] - 生成图片数量
 * @returns {Promise<Object>} 生成结果
 * @throws {ValidationError} 当参数验证失败时
 * @example
 * const result = await generateImage('一只可爱的小猫', {
 *   style: 'anime',
 *   resolution: '1024x1024'
 * });
 */
async function generateImage(prompt, options = {}) {
  // 实现代码
}
```

## 提交流程

### Git 工作流

我们使用 [GitHub Flow](https://guides.github.com/introduction/flow/) 工作流：

1. **创建功能分支**
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **进行开发**
   ```bash
   # 进行代码修改
   # 添加测试
   # 更新文档
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新的图片生成功能"
   ```

4. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建Pull Request**
   - 在GitHub上创建PR
   - 填写详细的描述
   - 链接相关Issue
   - 请求代码审查

### 提交消息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### 类型 (type)

- **feat**: 新功能
- **fix**: Bug修复
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **test**: 添加或修改测试
- **chore**: 构建过程或辅助工具的变动
- **perf**: 性能优化
- **ci**: CI/CD配置修改

#### 范围 (scope)

- **image-gen**: 图片生成模块
- **image-edit**: 图片编辑模块
- **batch**: 批量处理模块
- **story**: 故事配图模块
- **api**: API接口
- **docs**: 文档
- **test**: 测试
- **config**: 配置

#### 示例

```bash
# 新功能
git commit -m "feat(image-gen): 添加Imagen 4模型支持"

# Bug修复
git commit -m "fix(api): 修复图片上传时的内存泄漏问题"

# 文档更新
git commit -m "docs(readme): 更新安装指南和API示例"

# 重构
git commit -m "refactor(batch): 优化批量处理性能"

# 测试
git commit -m "test(story): 添加故事分析功能的单元测试"
```

### Pull Request 规范

#### PR标题
使用与commit message相同的格式：
```
feat(image-gen): 添加多分辨率支持
```

#### PR描述模板
```markdown
## 📝 变更描述
简要描述这个PR的目的和实现的功能。

## 🔗 相关Issue
Fixes #123
Closes #456

## 🧪 测试
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成
- [ ] 文档已更新

## 📋 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 重大变更
- [ ] 文档更新
- [ ] 性能优化
- [ ] 其他: ___________

## 🔍 测试说明
描述如何测试这些变更：
1. 步骤一
2. 步骤二
3. 期望结果

## 📸 截图/演示
（如果适用）添加截图或GIF来演示变更

## ⚠️ 破坏性变更
（如果有）描述任何破坏性变更和迁移说明

## 📌 检查清单
- [ ] 代码遵循项目代码规范
- [ ] 自测已通过
- [ ] 添加了必要的测试
- [ ] 文档已更新
- [ ] 变更日志已更新
```

## 问题报告

### Bug报告模板

在报告Bug时，请使用以下模板：

```markdown
**Bug描述**
简要描述Bug的现象

**重现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述你期望发生的行为

**实际行为**
描述实际发生的行为

**截图**
如果适用，添加截图来说明问题

**环境信息**
 - OS: [例如 iOS]
 - 浏览器: [例如 chrome, safari]
 - 版本: [例如 22]
 - Node.js版本: [例如 18.16.0]

**额外信息**
添加任何其他关于问题的信息
```

### 问题优先级

- **P0 (Critical)**: 系统崩溃、数据丢失、安全漏洞
- **P1 (High)**: 核心功能无法使用
- **P2 (Medium)**: 影响用户体验的问题
- **P3 (Low)**: 小的UI问题、优化建议

## 功能请求

### 功能请求模板

```markdown
**功能描述**
简要描述你想要的功能

**问题和动机**
描述这个功能要解决的问题

**建议的解决方案**
详细描述你认为应该如何实现这个功能

**替代方案**
描述你考虑过的任何替代解决方案

**使用场景**
描述这个功能的具体使用场景

**优先级**
- [ ] 高优先级（核心功能）
- [ ] 中优先级（改进体验）
- [ ] 低优先级（锦上添花）

**额外信息**
添加任何其他相关信息、截图或示例
```

## 代码审查

### 审查清单

#### 功能性
- [ ] 代码实现了预期功能
- [ ] 处理了边界情况
- [ ] 错误处理得当
- [ ] 性能符合要求

#### 代码质量
- [ ] 代码清晰易读
- [ ] 遵循项目代码规范
- [ ] 有适当的注释
- [ ] 没有代码重复

#### 测试
- [ ] 有足够的测试覆盖率
- [ ] 测试用例有效
- [ ] 集成测试通过
- [ ] 性能测试通过

#### 文档
- [ ] API文档已更新
- [ ] README已更新
- [ ] 变更日志已更新
- [ ] 示例代码有效

#### 安全性
- [ ] 没有安全漏洞
- [ ] 输入验证充分
- [ ] 敏感信息已保护
- [ ] 权限控制正确

### 审查指南

#### 对于审查者

1. **及时审查**: 在24-48小时内完成审查
2. **建设性反馈**: 提供具体、可操作的建议
3. **解释原因**: 说明为什么需要修改
4. **认可优点**: 指出代码中的亮点
5. **保持礼貌**: 使用友善、专业的语言

#### 对于贡献者

1. **回应反馈**: 及时回应审查意见
2. **解释决策**: 解释设计和实现决策
3. **持续改进**: 根据反馈持续改进
4. **测试修改**: 确保修改后的代码仍然有效
5. **更新文档**: 根据修改更新相关文档

## 发布流程

### 版本管理

我们使用[语义化版本控制](https://semver.org/)：

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 发布步骤

1. **准备发布**
   ```bash
   # 更新版本号
   npm version patch|minor|major
   
   # 更新变更日志
   # 运行全量测试
   npm test
   ```

2. **创建发布PR**
   ```bash
   git checkout -b release/v1.0.1
   git push origin release/v1.0.1
   # 创建PR到main分支
   ```

3. **发布标签**
   ```bash
   # 合并PR后
   git checkout main
   git pull origin main
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **发布到npm**（如果适用）
   ```bash
   npm publish
   ```

5. **创建GitHub Release**
   - 在GitHub上创建Release
   - 添加发布说明
   - 上传构建产物

## 社区指南

### 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请遵循以下准则：

- **尊重他人**: 对所有社区成员保持尊重和友善
- **包容性**: 欢迎不同背景和经验水平的贡献者
- **建设性**: 提供建设性的反馈和建议
- **专业性**: 保持专业的沟通方式
- **耐心**: 对新贡献者保持耐心和帮助态度

### 沟通渠道

- **GitHub Issues**: 问题报告和功能请求
- **GitHub Discussions**: 一般讨论和问答
- **Pull Requests**: 代码审查和讨论
- **项目邮件**: 重要通知和公告

### 获得帮助

如果您需要帮助，可以：

1. **查看文档**: 首先查看项目文档和FAQ
2. **搜索Issues**: 搜索现有的Issues和Discussions
3. **提出问题**: 在GitHub Discussions中提出问题
4. **联系维护者**: 通过邮件联系项目维护者

## 认可和奖励

我们重视每一个贡献，并通过以下方式认可贡献者：

### 贡献者列表
- 在README中列出所有贡献者
- 在发布说明中感谢贡献者
- 在社交媒体上分享重要贡献

### 特殊认可
- **First-time contributor**: 首次贡献者特殊标记
- **Core contributor**: 长期重要贡献者
- **Bug hunter**: 发现重要Bug的贡献者
- **Documentation hero**: 在文档方面做出突出贡献的人

### 成为维护者

优秀的贡献者可能被邀请成为项目维护者，享有：
- 代码审查权限
- Issue管理权限
- 发布决策参与权
- 项目方向讨论权

---

感谢您对项目的贡献！每一个贡献都让这个项目变得更好。如果您有任何问题或建议，请随时通过GitHub Issues或Discussions联系我们。

**Happy Contributing! 🎉**
