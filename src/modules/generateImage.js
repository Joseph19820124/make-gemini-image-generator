const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateRequest, commonSchemas } = require('../middleware/validation');
const { imageGenerationLimiter } = require('../middleware/rateLimiter');
const imageProcessor = require('../utils/imageProcessor');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 图片生成服务类
class ImageGenerationService {
  constructor() {
    this.supportedModels = {
      'gemini-2.0-flash-preview-image-generation': {
        name: 'Gemini 2.0 Flash',
        type: 'native',
        maxResolution: '2048x2048',
        features: ['text-to-image', 'multimodal', 'conversational']
      },
      'imagen-4': {
        name: 'Imagen 4',
        type: 'specialized',
        maxResolution: '2048x2048',
        features: ['text-to-image', 'high-quality']
      }
    };
  }

  /**
   * 使用Gemini 2.0 Flash生成图片
   */
  async generateWithGemini(apiKey, prompt, options = {}) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp' 
      });

      const {
        resolution = '1024x1024',
        style = '',
        imageCount = 1,
        seed
      } = options;

      // 构建提示词
      let enhancedPrompt = prompt;
      
      if (style) {
        enhancedPrompt += `, ${style} style`;
      }
      
      enhancedPrompt += `. Generate a high-quality image at ${resolution} resolution.`;
      
      if (seed) {
        enhancedPrompt += ` Use seed: ${seed}.`;
      }

      // 生成图片
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: enhancedPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: 'text/plain'
        }
      });

      // 这里需要根据Gemini 2.0 Flash的实际API响应进行调整
      // 目前这是模拟响应
      const images = [];
      
      for (let i = 0; i < imageCount; i++) {
        images.push({
          id: uuidv4(),
          url: `https://storage.googleapis.com/generated-images/${uuidv4()}.png`,
          width: parseInt(resolution.split('x')[0]),
          height: parseInt(resolution.split('x')[1]),
          format: 'png',
          metadata: {
            model: 'gemini-2.0-flash',
            prompt: prompt,
            style: style,
            seed: seed,
            timestamp: new Date().toISOString()
          }
        });
      }

      return {
        success: true,
        images,
        usage: {
          promptTokens: 50,
          totalTokens: 150
        }
      };
    } catch (error) {
      logger.error('Gemini图片生成失败:', error);
      throw error;
    }
  }

  /**
   * 使用Imagen 4生成图片
   */
  async generateWithImagen(apiKey, prompt, options = {}) {
    try {
      // 这里需要集成Imagen 4 API
      // 目前这是模拟实现
      const {
        resolution = '1024x1024',
        style = '',
        imageCount = 1,
        quality = 'standard'
      } = options;

      const images = [];
      
      for (let i = 0; i < imageCount; i++) {
        images.push({
          id: uuidv4(),
          url: `https://storage.googleapis.com/imagen-generated/${uuidv4()}.png`,
          width: parseInt(resolution.split('x')[0]),
          height: parseInt(resolution.split('x')[1]),
          format: 'png',
          metadata: {
            model: 'imagen-4',
            prompt: prompt,
            style: style,
            quality: quality,
            timestamp: new Date().toISOString()
          }
        });
      }

      return {
        success: true,
        images,
        usage: {
          promptTokens: 40,
          totalTokens: 120
        }
      };
    } catch (error) {
      logger.error('Imagen 4图片生成失败:', error);
      throw error;
    }
  }

  /**
   * 选择合适的模型生成图片
   */
  async generateImage(apiKey, prompt, options = {}) {
    const { model = 'gemini-2.0-flash-preview-image-generation' } = options;

    switch (model) {
      case 'gemini-2.0-flash-preview-image-generation':
        return await this.generateWithGemini(apiKey, prompt, options);
      case 'imagen-4':
        return await this.generateWithImagen(apiKey, prompt, options);
      default:
        throw new Error(`不支持的模型: ${model}`);
    }
  }
}

const imageService = new ImageGenerationService();

/**
 * 获取模块信息
 */
router.get('/', (req, res) => {
  res.json({
    module: 'generate-image',
    name: '生成图片',
    description: '根据文本描述生成高质量图片',
    version: '1.0.0',
    type: 'action',
    category: 'image-generation',
    capabilities: {
      models: Object.keys(imageService.supportedModels),
      resolutions: ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024', '2048x2048'],
      styles: ['realistic', 'anime', 'cartoon', 'oil-painting', 'watercolor', 'sketch'],
      maxImages: 4
    },
    endpoints: {
      generate: 'POST /modules/generate-image/generate',
      fields: 'GET /modules/generate-image/fields'
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
        name: 'prompt',
        label: '图片描述',
        type: 'textarea',
        required: true,
        help: '详细描述您想要生成的图片内容、风格和细节',
        placeholder: '一只可爱的小猫在樱花树下玩耍，动漫风格，高质量渲染'
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
          { value: '256x256', label: '256x256 - 小尺寸' },
          { value: '512x512', label: '512x512 - 中尺寸' },
          { value: '1024x1024', label: '1024x1024 - 标准正方形' },
          { value: '1024x1792', label: '1024x1792 - 竖向长图' },
          { value: '1792x1024', label: '1792x1024 - 横向长图' },
          { value: '2048x2048', label: '2048x2048 - 高清正方形' }
        ]
      },
      {
        name: 'style',
        label: '艺术风格',
        type: 'select',
        required: false,
        options: [
          { value: '', label: '自动选择' },
          { value: 'realistic', label: '写实风格' },
          { value: 'anime', label: '动漫风格' },
          { value: 'cartoon', label: '卡通风格' },
          { value: 'oil-painting', label: '油画风格' },
          { value: 'watercolor', label: '水彩风格' },
          { value: 'sketch', label: '素描风格' }
        ]
      },
      {
        name: 'imageCount',
        label: '生成数量',
        type: 'number',
        required: false,
        default: 1,
        min: 1,
        max: 4,
        help: '一次最多生成4张图片'
      },
      {
        name: 'quality',
        label: '图片质量',
        type: 'select',
        required: false,
        default: 'standard',
        options: [
          { value: 'standard', label: '标准质量' },
          { value: 'hd', label: '高清质量' }
        ]
      },
      {
        name: 'seed',
        label: '随机种子（可选）',
        type: 'number',
        required: false,
        help: '用于保证可重现的结果，相同种子和提示词会生成相似的图片'
      }
    ]
  });
});

/**
 * 生成图片的主要端点
 */
router.post('/generate', 
  imageGenerationLimiter,
  validateRequest(commonSchemas.imageGeneration),
  async (req, res) => {
    try {
      const {
        prompt,
        model,
        resolution,
        style,
        imageCount,
        quality,
        seed
      } = req.body;

      // 获取API密钥（从连接信息中）
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

      logger.info('开始生成图片:', {
        model,
        resolution,
        style,
        imageCount,
        promptLength: prompt.length
      });

      // 生成图片
      const result = await imageService.generateImage(apiKey, prompt, {
        model,
        resolution,
        style,
        imageCount,
        quality,
        seed
      });

      // 处理生成的图片
      const processedImages = [];
      
      for (const image of result.images) {
        // 这里可以添加图片后处理，比如水印、压缩等
        // const processedImage = await imageProcessor.optimizeImage(imageBuffer);
        
        processedImages.push({
          ...image,
          downloadUrl: image.url, // Make.com用于下载图片的URL
          thumbnailUrl: image.url.replace('.png', '_thumb.png')
        });
      }

      const response = {
        success: true,
        data: {
          images: processedImages,
          metadata: {
            prompt,
            model,
            resolution,
            style,
            imageCount: processedImages.length,
            generatedAt: new Date().toISOString()
          },
          usage: result.usage
        }
      };

      logger.info('图片生成成功:', {
        imageCount: processedImages.length,
        model,
        totalTokens: result.usage.totalTokens
      });

      res.json(response);

    } catch (error) {
      logger.error('图片生成失败:', error);
      
      let errorMessage = '图片生成失败';
      let statusCode = 500;

      if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API配额已超限，请稍后再试';
        statusCode = 429;
      } else if (error.message.includes('INVALID_ARGUMENT')) {
        errorMessage = '请求参数无效';
        statusCode = 400;
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = '没有权限访问该模型';
        statusCode = 403;
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
 * 获取支持的模型列表
 */
router.get('/models', (req, res) => {
  res.json({
    models: imageService.supportedModels
  });
});

module.exports = router;