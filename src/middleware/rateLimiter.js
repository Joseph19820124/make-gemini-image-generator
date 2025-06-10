const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// 创建速率限制器
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.API_RATE_LIMIT) || 100, // 每个IP最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: '15分钟'
  },
  standardHeaders: true, // 返回标准限率头信息
  legacyHeaders: false, // 禁用旧的X-RateLimit-*头信息
  handler: (req, res) => {
    logger.warn(`速率限制触发: IP ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        message: '请求过于频繁，请稍后再试',
        statusCode: 429,
        retryAfter: '15分钟'
      }
    });
  }
});

// 图片生成专用限制器（更严格）
const imageGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 50, // 每个IP每小时最多50个图片生成请求
  message: {
    error: '图片生成请求过于频繁，请稍后再试',
    retryAfter: '1小时'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`图片生成限制触发: IP ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        message: '图片生成请求过于频繁，请稍后再试',
        statusCode: 429,
        retryAfter: '1小时'
      }
    });
  }
});

module.exports = {
  rateLimiter,
  imageGenerationLimiter
};