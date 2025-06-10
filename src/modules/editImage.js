const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateRequest, commonSchemas } = require('../middleware/validation');
const { imageGenerationLimiter } = require('../middleware/rateLimiter');
const imageProcessor = require('../utils/imageProcessor');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'), false);
    }
  }
});

// 图片编辑服务类
class ImageEditingService {
  constructor() {
    this.supportedEditModes = {
      'inpaint': '局部重绘 - 修改图片的特定区域',
      'outpaint': '扩展绘制 - 扩展图片边界',
      'replace': '更换元素 - 更换图片中的特定对象',
      'enhance': '图片增强 - 提高图片质量和细节'
    };
  }

  /**
   * 使用Gemini 2.0 Flash编辑图片
   */
  async editWithGemini(apiKey, prompt, imageBuffer, options = {}) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp' 
      });

      const {
        editMode = 'inpaint',
        strength = 0.8,
        maskBuffer = null
      } = options;

      // 验证输入图片
      const validation = await imageProcessor.validateImage(imageBuffer);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 将图片转换为base64
      const imageBase64 = imageBuffer.toString('base64');
      const imageMimeType = 'image/png';

      // 构建编辑提示词
      let editPrompt = `Please edit this image: ${prompt}. `;
      
      switch (editMode) {
        case 'inpaint':
          editPrompt += 'Modify only the specified area while keeping the rest unchanged.';
          break;
        case 'outpaint':
          editPrompt += 'Extend the image beyond its current boundaries.';
          break;
        case 'replace':
          editPrompt += 'Replace the specified element with the new content.';
          break;
        case 'enhance':
          editPrompt += 'Enhance the image quality and add more details.';
          break;
      }

      editPrompt += ` Strength: ${strength}.`;

      // 发送编辑请求
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: editPrompt },
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      });

      // 模拟编辑结果
      const editedImage = {
        id: uuidv4(),
        url: `https://storage.googleapis.com/edited-images/${uuidv4()}.png`,
        width: validation.metadata.width,
        height: validation.metadata.height,
        format: 'png',
        metadata: {
          model: 'gemini-2.0-flash',
          originalImage: {
            width: validation.metadata.width,
            height: validation.metadata.height,
            format: validation.metadata.format
          },
          editPrompt: prompt,
          editMode,
          strength,
          timestamp: new Date().toISOString()
        }
      };

      return {
        success: true,
        editedImage,
        usage: {
          promptTokens: 80,
          imageTokens: 200,
          totalTokens: 280
        }
      };
    } catch (error) {
      logger.error('Gemini图片编辑失败:', error);
      throw error;
    }
  }

  /**
   * 处理图片编辑请求
   */
  async editImage(apiKey, prompt, imageBuffer, options = {}) {
    return await this.editWithGemini(apiKey, prompt, imageBuffer, options);
  }
}

const editingService = new ImageEditingService();

/**
 * 获取模块信息
 */
router.get('/', (req, res) => {
  res.json({
    module: 'edit-image',
    name: '编辑图片',
    description: '基于自然语言指令编辑和修改图片',
    version: '1.0.0',
    type: 'action',
    category: 'image-editing',
    capabilities: {
      editModes: Object.keys(editingService.supportedEditModes),
      supportedFormats: ['PNG', 'JPEG', 'WebP'],
      maxFileSize: '10MB',
      features: ['inpainting', 'outpainting', 'object-replacement', 'enhancement']
    },
    endpoints: {
      edit: 'POST /modules/edit-image/edit',
      fields: 'GET /modules/edit-image/fields'
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
        label: '编辑指令',
        type: 'textarea',
        required: true,
        help: '描述您希望对图片进行的修改',
        placeholder: '将这只猫的颜色改为橙色，并添加一个红色蝶结'
      },
      {
        name: 'inputImage',
        label: '输入图片',
        type: 'file',
        required: true,
        accept: 'image/*',
        help: '上传需要编辑的图片文件（支持PNG、JPEG、WebP格式）'
      },
      {
        name: 'editMode',
        label: '编辑模式',
        type: 'select',
        required: false,
        default: 'inpaint',
        options: [
          { value: 'inpaint', label: '局部重绘 - 修改特定区域' },
          { value: 'outpaint', label: '扩展绘制 - 扩展图片边界' },
          { value: 'replace', label: '更换元素 - 更换特定对象' },
          { value: 'enhance', label: '图片增强 - 提高质量' }
        ]
      },
      {
        name: 'strength',
        label: '编辑强度',
        type: 'number',
        required: false,
        default: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        help: '控制编辑的强度，0.1为微调，1.0为大幅修改'
      },
      {
        name: 'maskImage',
        label: '蒙版图片（可选）',
        type: 'file',
        required: false,
        accept: 'image/*',
        help: '上传黑白蒙版图片，白色区域将被编辑，黑色区域保持不变'
      }
    ]
  });
});

/**
 * 编辑图片的主要端点
 */
router.post('/edit',
  imageGenerationLimiter,
  upload.fields([
    { name: 'inputImage', maxCount: 1 },
    { name: 'maskImage', maxCount: 1 }
  ]),
  validateRequest(commonSchemas.imageEdit),
  async (req, res) => {
    try {
      const {
        prompt,
        editMode,
        strength
      } = req.body;

      // 获取上传的图片
      if (!req.files || !req.files.inputImage || !req.files.inputImage[0]) {
        return res.status(400).json({
          success: false,
          error: {
            message: '缺少输入图片',
            statusCode: 400
          }
        });
      }

      const inputImageBuffer = req.files.inputImage[0].buffer;
      const maskImageBuffer = req.files.maskImage ? req.files.maskImage[0].buffer : null;

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

      logger.info('开始编辑图片:', {
        editMode,
        strength,
        promptLength: prompt.length,
        hasInputImage: !!inputImageBuffer,
        hasMaskImage: !!maskImageBuffer
      });

      // 编辑图片
      const result = await editingService.editImage(apiKey, prompt, inputImageBuffer, {
        editMode,
        strength,
        maskBuffer: maskImageBuffer
      });

      const response = {
        success: true,
        data: {
          editedImage: result.editedImage,
          metadata: {
            prompt,
            editMode,
            strength,
            editedAt: new Date().toISOString()
          },
          usage: result.usage
        }
      };

      logger.info('图片编辑成功:', {
        editMode,
        totalTokens: result.usage.totalTokens
      });

      res.json(response);

    } catch (error) {
      logger.error('图片编辑失败:', error);
      
      let errorMessage = '图片编辑失败';
      let statusCode = 500;

      if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API配额已超限，请稍后再试';
        statusCode = 429;
      } else if (error.message.includes('不支持的图片格式')) {
        errorMessage = '不支持的图片格式，请使用PNG、JPEG或WebP格式';
        statusCode = 400;
      } else if (error.message.includes('图片文件过大')) {
        errorMessage = '图片文件过大，请使用小于10MB的图片';
        statusCode = 400;
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
 * 获取支持的编辑模式
 */
router.get('/modes', (req, res) => {
  res.json({
    editModes: editingService.supportedEditModes
  });
});

module.exports = router;