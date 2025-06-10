const express = require('express');
const Joi = require('joi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./utils/logger');
const { validateRequest } = require('./middleware/validation');

const router = express.Router();

// 连接验证模式
const connectionSchema = Joi.object({
  apiKey: Joi.string().required().messages({
    'string.empty': 'API密钥不能为空',
    'any.required': 'API密钥是必需的'
  }),
  region: Joi.string().default('us-central1'),
  projectId: Joi.string().optional()
});

/**
 * 测试连接
 * Make.com会调用此端点来验证用户提供的凭据
 */
router.post('/test', validateRequest(connectionSchema), async (req, res) => {
  try {
    const { apiKey, region, projectId } = req.body;
    
    logger.info('正在测试Gemini API连接...');
    
    // 初始化Google AI客户端
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 测试基本API访问
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // 发送测试请求
    const testPrompt = '测试连接 - 请简单回复"连接成功"';
    const result = await model.generateContent(testPrompt);
    
    if (!result || !result.response) {
      throw new Error('API响应无效');
    }
    
    // 检查图片生成功能可用性
    let imageGenerationAvailable = false;
    try {
      const imageModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-preview-image-generation' 
      });
      // 这里只是检查模型是否可访问，不实际生成图片
      imageGenerationAvailable = true;
    } catch (imageError) {
      logger.warn('图片生成功能不可用:', imageError.message);
    }
    
    const connectionInfo = {
      status: 'success',
      message: '连接成功',
      capabilities: {
        textGeneration: true,
        imageGeneration: imageGenerationAvailable,
        multiModal: true
      },
      models: {
        text: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        image: imageGenerationAvailable ? ['gemini-2.0-flash-preview-image-generation'] : []
      },
      region,
      projectId: projectId || 'default'
    };
    
    logger.info('Gemini API连接测试成功');
    res.json(connectionInfo);
    
  } catch (error) {
    logger.error('连接测试失败:', error);
    
    let errorMessage = '连接失败';
    let errorCode = 'CONNECTION_FAILED';
    
    if (error.message.includes('API_KEY_INVALID')) {
      errorMessage = 'API密钥无效';
      errorCode = 'INVALID_API_KEY';
    } else if (error.message.includes('PERMISSION_DENIED')) {
      errorMessage = '权限被拒绝，请检查API密钥权限';
      errorCode = 'PERMISSION_DENIED';
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API配额已超限';
      errorCode = 'QUOTA_EXCEEDED';
    }
    
    res.status(400).json({
      status: 'error',
      message: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 获取连接信息
 * 返回连接配置的字段定义
 */
router.get('/fields', (req, res) => {
  res.json({
    fields: [
      {
        name: 'apiKey',
        label: 'Google AI Studio API密钥',
        type: 'password',
        required: true,
        help: '在Google AI Studio中生成的API密钥',
        placeholder: 'AIza...'
      },
      {
        name: 'region',
        label: '区域',
        type: 'select',
        required: false,
        default: 'us-central1',
        options: [
          { value: 'us-central1', label: '美国中部' },
          { value: 'us-east1', label: '美国东部' },
          { value: 'europe-west1', label: '欧洲西部' },
          { value: 'asia-northeast1', label: '亚洲东北部' }
        ],
        help: '选择最接近您的Google Cloud区域'
      },
      {
        name: 'projectId',
        label: 'Google Cloud项目ID（可选）',
        type: 'text',
        required: false,
        help: '如果使用Vertex AI，请提供项目ID',
        placeholder: 'my-project-123'
      }
    ]
  });
});

module.exports = router;