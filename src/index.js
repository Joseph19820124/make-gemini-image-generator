const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connection = require('./connection');
const modules = require('./modules');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Make.com模块路由
app.use('/connection', connection);
app.use('/modules', modules);

// 根路由 - 模块信息
app.get('/', (req, res) => {
  res.json({
    name: 'Gemini Image Generator for Make.com',
    version: '1.0.0',
    description: 'Custom Make.com module for Google Gemini image generation',
    features: [
      'Imagen 4 image generation',
      'Gemini 2.0 Flash native image generation', 
      'Multi-turn image editing',
      'Batch processing',
      'Story illustration'
    ],
    endpoints: {
      connection: '/connection',
      modules: '/modules',
      health: '/health'
    },
    documentation: 'https://github.com/Joseph19820124/make-gemini-image-generator#readme'
  });
});

// 错误处理
app.use(notFound);
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 Gemini Image Generator服务已启动`);
  logger.info(`📍 端口: ${PORT}`);
  logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📖 文档: http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

module.exports = app;