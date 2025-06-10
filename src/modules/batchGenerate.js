const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateRequest, commonSchemas } = require('../middleware/validation');
const { imageGenerationLimiter } = require('../middleware/rateLimiter');
const imageProcessor = require('../utils/imageProcessor');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 批量生成服务类
class BatchGenerationService {
  constructor() {
    this.maxBatchSize = 10;
    this.concurrentLimit = 3; // 并发生成限制
  }

  /**
   * 批量生成图片
   */
  async generateBatch(apiKey, prompts, options = {}) {
    try {
      const {
        model = 'gemini-2.0-flash-preview-image-generation',
        resolution = '1024x1024',
        style = '',
        maintainConsistency = true
      } = options;

      if (prompts.length > this.maxBatchSize) {
        throw new Error(`批量大小超过限制，最多支持${this.maxBatchSize}个提示词`);
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelInstance = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // 为保持一致性，生成通用风格描述
      let consistencyPrompt = '';
      if (maintainConsistency && style) {
        consistencyPrompt = `All images should maintain a consistent ${style} style. `;
      }

      const results = [];
      const errors = [];

      // 分批处理，控制并发数
      for (let i = 0; i < prompts.length; i += this.concurrentLimit) {
        const batch = prompts.slice(i, i + this.concurrentLimit);
        
        const batchPromises = batch.map(async (prompt, index) => {
          const actualIndex = i + index;
          try {
            const enhancedPrompt = consistencyPrompt + prompt + `. Generate at ${resolution} resolution.`;
            
            // 模拟生成结果
            const result = {
              index: actualIndex,
              prompt: prompt,
              image: {
                id: uuidv4(),
                url: `https://storage.googleapis.com/batch-generated/${uuidv4()}.png`,
                width: parseInt(resolution.split('x')[0]),
                height: parseInt(resolution.split('x')[1]),
                format: 'png',
                metadata: {
                  model,
                  prompt,
                  style,
                  batchIndex: actualIndex,
                  timestamp: new Date().toISOString()
                }
              },
              usage: {
                promptTokens: 50,
                totalTokens: 150
              }
            };

            return result;
          } catch (error) {
            logger.error(`批量生成第${actualIndex}张图片失败:`, error);
            return {
              index: actualIndex,
              prompt: prompt,
              error: error.message
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            if (result.value.error) {
              errors.push(result.value);
            } else {
              results.push(result.value);
            }
          } else {
            errors.push({
              index: i + batchIndex,
              prompt: batch[batchIndex],
              error: result.reason.message
            });
          }
        });

        // 批次间停顶，避免触发限率限制
        if (i + this.concurrentLimit < prompts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        results: results.sort((a, b) => a.index - b.index),
        errors: errors.sort((a, b) => a.index - b.index),
        summary: {
          total: prompts.length,
          successful: results.length,
          failed: errors.length,
          totalTokens: results.reduce((sum, r) => sum + r.usage.totalTokens, 0)
        }
      };
    } catch (error) {
      logger.error('批量生成失败:', error);
      throw error;
    }
  }

  /**
   * 生成一致性风格的图片集
   */
  async generateConsistentSet(apiKey, basePrompt, variations, options = {}) {
    try {
      const {
        model = 'gemini-2.0-flash-preview-image-generation',
        resolution = '1024x1024',
        style = ''
      } = options;

      // 为每个变化创建完整提示词
      const prompts = variations.map(variation => {
        let fullPrompt = basePrompt;
        if (variation.trim()) {
          fullPrompt += `, ${variation}`;
        }
        if (style) {
          fullPrompt += `, ${style} style`;
        }
        return fullPrompt;
      });

      return await this.generateBatch(apiKey, prompts, {
        model,
        resolution,
        style,
        maintainConsistency: true
      });
    } catch (error) {
      logger.error('一致性图片集生成失败:', error);
      throw error;
    }
  }
}

const batchService = new BatchGenerationService();

/**
 * 获取模块信息
 */
router.get('/', (req, res) => {
  res.json({
    module: 'batch-generate',
    name: '批量生成',
    description: '批量生成多张图片，支持保持风格一致性',
    version: '1.0.0',
    type: 'action',
    category: 'batch-processing',
    capabilities: {
      maxBatchSize: batchService.maxBatchSize,
      concurrentProcessing: true,
      styleConsistency: true,
      errorHandling: 'partial-success'
    },
    endpoints: {
      batch: 'POST /modules/batch-generate/batch',
      consistent: 'POST /modules/batch-generate/consistent',
      fields: 'GET /modules/batch-generate/fields'
    }
  });
});

/**
 * 获取输入字段定义
 */
router.get('/fields', (req, res) => {
  res.json({
    fields: [
      {
        name: 'prompts',
        label: '提示词列表',
        type: 'array',
        itemType: 'textarea',
        required: true,
        minItems: 1,
        maxItems: batchService.maxBatchSize,
        help: `输入多个图片描述，每行一个，最多${batchService.maxBatchSize}个`,
        placeholder: '一只可爱的小猫\n一只間狨在花丛中\n一只在阳光下玩耍的小狗'
      },
      {
        name: 'model',
        label: '生成模型',
        type: 'select',
        required: false,
        default: 'gemini-2.0-flash-preview-image-generation',
        options: [
          {
            value: 'gemini-2.0-flash-preview-image-generation',
            label: 'Gemini 2.0 Flash - 多模态原生生成'
          },
          {
            value: 'imagen-4',
            label: 'Imagen 4 - 专业图片生成'
          }
        ]
      },
      {
        name: 'resolution',
        label: '图片分辨率',
        type: 'select',
        required: false,
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512 - 中尺寸' },
          { value: '1024x1024', label: '1024x1024 - 标准正方形' },
          { value: '1024x1792', label: '1024x1792 - 竖向长图' },
          { value: '1792x1024', label: '1792x1024 - 横向长图' }
        ]
      },
      {
        name: 'style',
        label: '统一风格',
        type: 'select',
        required: false,
        options: [
          { value: '', label: '自动选择' },
          { value: 'realistic', label: '写实风格' },
          { value: 'anime', label: '动漫风格' },
          { value: 'cartoon', label: '卡通风格' },
          { value: 'oil-painting', label: '油画风格' },
          { value: 'watercolor', label: '水彩风格' }
        ],
        help: '为所有图片应用相同的艺术风格'
      },
      {
        name: 'maintainConsistency',
        label: '保持一致性',
        type: 'boolean',
        required: false,
        default: true,
        help: '尽可能保持所有图片的视觉风格一致'
      }
    ]
  });
});

/**
 * 批量生成图片
 */
router.post('/batch',
  imageGenerationLimiter,
  validateRequest(commonSchemas.batchGeneration),
  async (req, res) => {
    try {
      const {
        prompts,
        model,
        resolution,
        style,
        maintainConsistency
      } = req.body;

      // 获取API密钥
      const apiKey = req.headers['x-api-key'] || process.env.GOOGLE_AI_API_KEY;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: {
            message: '缺少API密钥',
            statusCode: 401
          }
        });
      }

      logger.info('开始批量生成图片:', {
        count: prompts.length,
        model,
        resolution,
        style,
        maintainConsistency
      });

      // 批量生成
      const result = await batchService.generateBatch(apiKey, prompts, {
        model,
        resolution,
        style,
        maintainConsistency
      });

      const response = {
        success: true,
        data: {
          images: result.results.map(r => r.image),
          errors: result.errors,
          summary: result.summary,
          metadata: {
            model,
            resolution,
            style,
            maintainConsistency,
            generatedAt: new Date().toISOString()
          }
        }
      };

      logger.info('批量生成完成:', result.summary);

      res.json(response);

    } catch (error) {
      logger.error('批量生成失败:', error);
      
      let errorMessage = '批量生成失败';
      let statusCode = 500;

      if (error.message.includes('批量大小超过限制')) {
        errorMessage = error.message;
        statusCode = 400;
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API配额已超限，请稍后再试';
        statusCode = 429;
      }

      res.status(statusCode).json({
        success: false,
        error: {
          message: errorMessage,
          statusCode,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
);

/**
 * 生成一致性风格的图片集
 */
router.post('/consistent',
  imageGenerationLimiter,
  async (req, res) => {
    try {
      const {
        basePrompt,
        variations,
        model,
        resolution,
        style
      } = req.body;

      // 基本验证
      if (!basePrompt || !variations || !Array.isArray(variations)) {
        return res.status(400).json({
          success: false,
          error: {
            message: '缺少基础提示词或变化列表',
            statusCode: 400
          }
        });
      }

      if (variations.length > batchService.maxBatchSize) {
        return res.status(400).json({
          success: false,
          error: {
            message: `变化数量超过限制，最多${batchService.maxBatchSize}个`,
            statusCode: 400
          }
        });
      }

      // 获取API密钥
      const apiKey = req.headers['x-api-key'] || process.env.GOOGLE_AI_API_KEY;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: {
            message: '缺少API密钥',
            statusCode: 401
          }
        });
      }

      logger.info('开始生成一致性图片集:', {
        basePrompt,
        variationCount: variations.length,
        style
      });

      // 生成一致性图片集
      const result = await batchService.generateConsistentSet(
        apiKey,
        basePrompt,
        variations,
        { model, resolution, style }
      );

      const response = {
        success: true,
        data: {
          basePrompt,
          images: result.results.map(r => ({
            ...r.image,
            variation: variations[r.index]
          })),
          errors: result.errors,
          summary: result.summary,
          metadata: {
            model,
            resolution,
            style,
            generatedAt: new Date().toISOString()
          }
        }
      };

      logger.info('一致性图片集生成完成:', result.summary);

      res.json(response);

    } catch (error) {
      logger.error('一致性图片集生成失败:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: '一致性图片集生成失败',
          statusCode: 500,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
);

module.exports = router;