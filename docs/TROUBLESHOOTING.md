# 故障排除指南

本文档提供常见问题的解决方案和调试技巧。

## 目录

- [常见问题](#常见问题)
- [API错误](#api错误)
- [性能问题](#性能问题)
- [部署问题](#部署问题)
- [调试技巧](#调试技巧)
- [日志分析](#日志分析)
- [监控和诊断](#监控和诊断)

## 常见问题

### 1. 服务无法启动

#### 症状
```bash
Error: Cannot find module '@google/generative-ai'
```

#### 解决方案
```bash
# 删除node_modules并重新安装
rm -rf node_modules package-lock.json
npm install

# 或使用yarn
rm -rf node_modules yarn.lock
yarn install
```

#### 症状
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

#### 解决方案
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用不同端口
PORT=3001 npm start
```

### 2. API密钥问题

#### 症状
```json
{
  "success": false,
  "error": {
    "message": "API密钥无效",
    "statusCode": 401
  }
}
```

#### 解决方案

1. **验证API密钥格式**
```bash
# Google AI Studio API密钥应该以"AIza"开头
echo $GOOGLE_AI_API_KEY | grep -E '^AIza[0-9A-Za-z-_]{35}$'
```

2. **检查API权限**
```bash
# 测试API密钥
curl -H "Authorization: Bearer $GOOGLE_AI_API_KEY" \
  "https://generativelanguage.googleapis.com/v1/models"
```

3. **更新环境变量**
```bash
# 确保.env文件中的密钥正确
cat .env | grep GOOGLE_AI_API_KEY

# 重新启动服务
npm restart
```

### 3. 图片生成失败

#### 症状
```json
{
  "success": false,
  "error": {
    "message": "图片生成失败",
    "statusCode": 500
  }
}
```

#### 诊断步骤

1. **检查提示词**
```javascript
// 确保提示词不为空且长度合适
if (!prompt || prompt.length > 2000) {
  throw new Error('Invalid prompt');
}
```

2. **验证模型可用性**
```bash
# 测试Gemini API连接
curl -X POST http://localhost:3000/connection/test \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key",
    "region": "us-central1"
  }'
```

3. **检查网络连接**
```bash
# 测试到Google AI的连接
ping ai.google.dev
nslookup ai.google.dev
```

### 4. 文件上传问题

#### 症状
```
Error: File too large
```

#### 解决方案
```javascript
// 检查文件大小限制
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error(`File too large: ${file.size} bytes`);
}
```

#### 症状
```
Error: Unsupported file format
```

#### 解决方案
```javascript
// 支持的格式
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

if (!SUPPORTED_FORMATS.includes(file.mimetype)) {
  throw new Error(`Unsupported format: ${file.mimetype}`);
}
```

## API错误

### 错误代码对照表

| 状态码 | 错误类型 | 常见原因 | 解决方案 |
|--------|----------|----------|----------|
| 400 | Bad Request | 请求参数无效 | 检查请求格式和参数 |
| 401 | Unauthorized | API密钥无效 | 更新API密钥 |
| 403 | Forbidden | 权限不足 | 检查API密钥权限 |
| 429 | Too Many Requests | 请求频率过高 | 实现退避重试 |
| 500 | Internal Server Error | 服务器内部错误 | 查看服务器日志 |
| 502 | Bad Gateway | 上游服务错误 | 检查Google AI服务状态 |
| 503 | Service Unavailable | 服务暂时不可用 | 稍后重试 |
| 504 | Gateway Timeout | 请求超时 | 增加超时时间 |

### 重试机制实现

```javascript
class RetryHandler {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }
  
  async executeWithRetry(fn) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        if (this.shouldRetry(error)) {
          const delay = this.calculateDelay(attempt);
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }
  
  shouldRetry(error) {
    const retryableErrors = [429, 500, 502, 503, 504];
    return retryableErrors.includes(error.status) || 
           error.code === 'NETWORK_ERROR';
  }
  
  calculateDelay(attempt) {
    // 指数退避
    return this.baseDelay * Math.pow(2, attempt);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 性能问题

### 1. 响应时间过长

#### 诊断
```bash
# 测试API响应时间
time curl -X POST http://localhost:3000/modules/generate-image/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_key" \
  -d '{"prompt": "test image"}'
```

#### 优化措施

1. **启用请求缓存**
```javascript
const cache = new Map();

function getCacheKey(prompt, options) {
  return JSON.stringify({ prompt, ...options });
}

async function generateWithCache(prompt, options) {
  const key = getCacheKey(prompt, options);
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await generateImage(prompt, options);
  cache.set(key, result);
  
  return result;
}
```

2. **并发处理优化**
```javascript
const pLimit = require('p-limit');
const limit = pLimit(3); // 限制并发数

async function batchProcess(items) {
  const promises = items.map(item => 
    limit(() => processItem(item))
  );
  
  return Promise.all(promises);
}
```

### 2. 内存使用过高

#### 监控内存使用
```javascript
function logMemoryUsage() {
  const used = process.memoryUsage();
  
  console.log('Memory usage:');
  for (let key in used) {
    console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
}

// 定期监控
setInterval(logMemoryUsage, 30000);
```

#### 内存优化
```javascript
// 及时释放大对象
function processLargeImage(imageData) {
  try {
    // 处理图片
    const result = processImage(imageData);
    return result;
  } finally {
    // 显式清理
    imageData = null;
    if (global.gc) {
      global.gc();
    }
  }
}
```

### 3. CPU使用率过高

#### 分析CPU使用
```bash
# 使用clinic.js分析性能
npm install -g clinic
clinic doctor -- node src/index.js

# 生成火焰图
clinic flame -- node src/index.js
```

#### 优化措施
```javascript
// 使用worker threads处理CPU密集型任务
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // 主线程
  function processImageInWorker(imageData) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename);
      
      worker.postMessage(imageData);
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }
} else {
  // Worker线程
  parentPort.on('message', (imageData) => {
    const result = expensiveImageProcessing(imageData);
    parentPort.postMessage(result);
  });
}
```

## 部署问题

### 1. Docker构建失败

#### 症状
```
ERROR: failed to solve: process "/bin/sh -c npm install" did not complete
```

#### 解决方案
```dockerfile
# 使用.dockerignore
# .dockerignore
node_modules
npm-debug.log
.env
.git

# 优化Dockerfile
FROM node:18-alpine

# 安装依赖
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 先复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 2. 环境变量问题

#### 诊断
```bash
# 检查容器内环境变量
docker exec container_name env | grep GOOGLE_AI_API_KEY

# 查看docker-compose环境
docker-compose config
```

#### 解决方案
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: gemini-image-generator
    environment:
      - NODE_ENV=production
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
    env_file:
      - .env.production
```

### 3. 负载均衡问题

#### Nginx配置问题
```bash
# 测试Nginx配置
nginx -t

# 重新加载配置
nginx -s reload

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

#### 健康检查
```nginx
upstream gemini_app {
    server app1:3000 max_fails=3 fail_timeout=30s;
    server app2:3000 max_fails=3 fail_timeout=30s;
    
    # 添加健康检查
    keepalive 32;
}

server {
    location /health {
        proxy_pass http://gemini_app/health;
        proxy_set_header Host $host;
        
        # 健康检查不记录日志
        access_log off;
    }
}
```

## 调试技巧

### 1. 启用详细日志

```bash
# 设置调试级别
export DEBUG=gemini:*
export LOG_LEVEL=debug

# 启动服务
npm start
```

### 2. 使用调试器

```bash
# Node.js调试
node --inspect src/index.js

# Chrome DevTools
# 打开 chrome://inspect
```

### 3. API测试脚本

```bash
#!/bin/bash
# test-api.sh

API_BASE="http://localhost:3000"
API_KEY="your_api_key"

echo "Testing health endpoint..."
curl -s "$API_BASE/health" | jq

echo "Testing connection..."
curl -s -X POST "$API_BASE/connection/test" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "'$API_KEY'",
    "region": "us-central1"
  }' | jq

echo "Testing image generation..."
curl -s -X POST "$API_BASE/modules/generate-image/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "prompt": "test image",
    "resolution": "512x512",
    "imageCount": 1
  }' | jq
```

## 日志分析

### 1. 日志格式

```javascript
// 结构化日志
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

// 使用示例
logger.info('Image generation started', {
  prompt: prompt.substring(0, 100),
  model: options.model,
  resolution: options.resolution,
  userId: req.user?.id
});
```

### 2. 日志分析脚本

```bash
#!/bin/bash
# analyze-logs.sh

LOG_FILE="logs/app.log"

echo "=== Error Summary ==="
grep '"level":"error"' $LOG_FILE | \
  jq -r '.message' | \
  sort | uniq -c | sort -nr

echo "\n=== API Response Times ==="
grep 'API request completed' $LOG_FILE | \
  jq -r '.duration' | \
  awk '{
    sum += $1
    count++
  } END {
    print "Average:", sum/count "ms"
    print "Total requests:", count
  }'

echo "\n=== Most Active Users ==="
grep '"userId"' $LOG_FILE | \
  jq -r '.userId' | \
  sort | uniq -c | sort -nr | head -10
```

### 3. 实时日志监控

```bash
# 监控错误日志
tail -f logs/app.log | grep '"level":"error"' | jq

# 监控特定API
tail -f logs/app.log | grep 'generate-image' | jq '.duration'

# 监控性能问题
tail -f logs/app.log | awk '/duration/ && $NF > 5000 {print}'
```

## 监控和诊断

### 1. 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:3000"
HEALTH_ENDPOINT="$API_URL/health"
MAX_RESPONSE_TIME=5000  # 5秒

# 检查服务是否响应
start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" -o /tmp/health_response $HEALTH_ENDPOINT)
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))

if [ "$response" = "200" ]; then
    if [ $response_time -lt $MAX_RESPONSE_TIME ]; then
        echo "✅ Service is healthy (${response_time}ms)"
        exit 0
    else
        echo "⚠️ Service responding slowly (${response_time}ms)"
        exit 1
    fi
else
    echo "❌ Service is unhealthy (HTTP $response)"
    cat /tmp/health_response
    exit 2
fi
```

### 2. 性能监控

```javascript
// performance-monitor.js
const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: 0,
      errors: 0,
      totalTime: 0,
      lastMinuteRequests: [],
      memoryUsage: []
    };
    
    // 每分钟收集指标
    setInterval(() => this.collectMetrics(), 60000);
  }
  
  recordRequest(duration, success = true) {
    this.metrics.requests++;
    this.metrics.totalTime += duration;
    
    if (!success) {
      this.metrics.errors++;
    }
    
    const now = Date.now();
    this.metrics.lastMinuteRequests.push({ time: now, duration, success });
    
    // 清理超过1分钟的记录
    this.metrics.lastMinuteRequests = this.metrics.lastMinuteRequests
      .filter(req => now - req.time < 60000);
    
    // 检查是否需要告警
    this.checkAlerts();
  }
  
  collectMetrics() {
    const memory = process.memoryUsage();
    this.metrics.memoryUsage.push({
      time: Date.now(),
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal
    });
    
    // 只保留最近24小时的数据
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics.memoryUsage = this.metrics.memoryUsage
      .filter(m => m.time > twentyFourHoursAgo);
  }
  
  checkAlerts() {
    const recentRequests = this.metrics.lastMinuteRequests;
    const errorRate = recentRequests.filter(r => !r.success).length / recentRequests.length;
    const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length;
    
    if (errorRate > 0.1) {  // 错误率超过10%
      this.emit('alert', 'high_error_rate', { errorRate, count: recentRequests.length });
    }
    
    if (avgResponseTime > 10000) {  // 平均响应时间超过10秒
      this.emit('alert', 'slow_response', { avgResponseTime });
    }
  }
  
  getStats() {
    const recentRequests = this.metrics.lastMinuteRequests;
    const errorRate = recentRequests.length > 0 
      ? recentRequests.filter(r => !r.success).length / recentRequests.length 
      : 0;
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
      : 0;
    
    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      overallErrorRate: this.metrics.errors / this.metrics.requests,
      overallAvgResponseTime: this.metrics.totalTime / this.metrics.requests,
      lastMinuteRequests: recentRequests.length,
      lastMinuteErrorRate: errorRate,
      lastMinuteAvgResponseTime: avgResponseTime,
      currentMemory: process.memoryUsage()
    };
  }
}

module.exports = PerformanceMonitor;
```

### 3. 告警设置

```javascript
// alerts.js
const monitor = new PerformanceMonitor();

monitor.on('alert', async (type, data) => {
  const alertMessage = {
    'high_error_rate': `🚨 高错误率告警：${(data.errorRate * 100).toFixed(1)}% (${data.count} 请求)`,
    'slow_response': `🐌 响应缓慢告警：平均响应时间 ${data.avgResponseTime.toFixed(0)}ms`,
    'memory_leak': `💾 内存泄漏告警：内存使用 ${(data.memoryUsage / 1024 / 1024).toFixed(0)}MB`
  };
  
  // 发送Slack通知
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: alertMessage[type],
        channel: '#alerts',
        username: 'Gemini Monitor'
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }
  
  // 记录到日志
  logger.error('Performance alert', { type, data });
});
```

通过以上故障排除指南，你应该能够快速诊断和解决大部分常见问题。记住，预防胜于治疗 - 实施良好的监控和日志记录可以帮助你在问题变严重之前发现并解决它们。
