const logger = require('../utils/logger');

// 404错误处理
const notFound = (req, res, next) => {
  const error = new Error(`找不到路径: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// 通用错误处理
const errorHandler = (err, req, res, next) => {
  // 记录错误
  logger.error('API错误:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    ip: req.ip
  });

  // 默认500错误
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose重复错误
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field}已经存在`;
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
  }

  // JWT过期错误
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
  }

  // Google AI API错误
  if (err.message.includes('API_KEY_INVALID')) {
    statusCode = 401;
    message = 'Google AI API密钥无效';
  }

  if (err.message.includes('QUOTA_EXCEEDED')) {
    statusCode = 429;
    message = 'API调用配额已超限';
  }

  if (err.message.includes('PERMISSION_DENIED')) {
    statusCode = 403;
    message = '没有访问权限';
  }

  // 返回错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};

module.exports = {
  notFound,
  errorHandler
};