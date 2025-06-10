const Joi = require('joi');
const logger = require('../utils/logger');

// 请求验证中间件
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      logger.warn('请求验证失败:', {
        url: req.originalUrl,
        method: req.method,
        errors: error.details,
        body: req.body
      });

      return res.status(400).json({
        success: false,
        error: {
          message: '请求参数验证失败',
          details: errorMessage,
          statusCode: 400
        }
      });
    }

    // 更新请求体为验证后的值
    req.body = value;
    next();
  };
};

// 通用验证模式
const commonSchemas = {
  // 图片生成基础参数
  imageGeneration: Joi.object({
    prompt: Joi.string().required().min(1).max(2000).messages({
      'string.empty': '提示词不能为空',
      'string.min': '提示词不能为空',
      'string.max': '提示词长度不能超过2000字符',
      'any.required': '提示词是必需的'
    }),
    model: Joi.string().valid(
      'gemini-2.0-flash-preview-image-generation',
      'imagen-4'
    ).default('gemini-2.0-flash-preview-image-generation'),
    resolution: Joi.string().valid(
      '256x256', '512x512', '1024x1024', '1024x1792', '1792x1024', '2048x2048'
    ).default('1024x1024'),
    aspectRatio: Joi.string().valid(
      '1:1', '16:9', '9:16', '4:3', '3:4'
    ).optional(),
    style: Joi.string().valid(
      'realistic', 'anime', 'cartoon', 'oil-painting', 'watercolor', 'sketch'
    ).optional(),
    imageCount: Joi.number().integer().min(1).max(4).default(1),
    quality: Joi.string().valid('standard', 'hd').default('standard'),
    seed: Joi.number().integer().optional()
  }),

  // 图片编辑参数
  imageEdit: Joi.object({
    prompt: Joi.string().required().min(1).max(2000),
    inputImage: Joi.string().required().messages({
      'any.required': '输入图片是必需的'
    }),
    model: Joi.string().valid(
      'gemini-2.0-flash-preview-image-generation'
    ).default('gemini-2.0-flash-preview-image-generation'),
    editMode: Joi.string().valid(
      'inpaint', 'outpaint', 'replace', 'enhance'
    ).default('inpaint'),
    maskImage: Joi.string().optional(),
    strength: Joi.number().min(0).max(1).default(0.8)
  }),

  // 批量生成参数
  batchGeneration: Joi.object({
    prompts: Joi.array().items(
      Joi.string().min(1).max(2000)
    ).min(1).max(10).required(),
    model: Joi.string().valid(
      'gemini-2.0-flash-preview-image-generation',
      'imagen-4'
    ).default('gemini-2.0-flash-preview-image-generation'),
    resolution: Joi.string().valid(
      '256x256', '512x512', '1024x1024', '1024x1792', '1792x1024', '2048x2048'
    ).default('1024x1024'),
    maintainConsistency: Joi.boolean().default(true),
    style: Joi.string().valid(
      'realistic', 'anime', 'cartoon', 'oil-painting', 'watercolor', 'sketch'
    ).optional()
  })
};

module.exports = {
  validateRequest,
  commonSchemas
};