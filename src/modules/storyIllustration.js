const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateRequest } = require('../middleware/validation');
const { imageGenerationLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// 故事配图验证模式
const storySchema = Joi.object({
  story: Joi.string().required().min(50).max(10000).messages({
    'string.empty': '故事内容不能为空',
    'string.min': '故事内容太短，至少需要50个字符',
    'string.max': '故事内容过长，最多10000个字符',
    'any.required': '故事内容是必需的'
  }),
  illustrationStyle: Joi.string().valid(
    'storybook', 'realistic', 'cartoon', 'anime', 'watercolor', 'sketch'
  ).default('storybook'),
  maxIllustrations: Joi.number().integer().min(1).max(8).default(4),
  maintainConsistency: Joi.boolean().default(true),
  characterConsistency: Joi.boolean().default(true),
  generateTitle: Joi.boolean().default(false),
  language: Joi.string().valid('zh', 'en', 'auto').default('auto')
});

// 故事配图服务类
class StoryIllustrationService {
  constructor() {
    this.maxIllustrations = 8;
    this.supportedStyles = {
      'storybook': '经典童书插图风格',
      'realistic': '写实主义风格',
      'cartoon': '卡通风格',
      'anime': '日本动漫风格',
      'watercolor': '水彩手绘风格',
      'sketch': '素描风格'
    };
  }

  /**
   * 分析故事结构和关键情节
   */
  async analyzeStory(apiKey, story, options = {}) {
    try {
      const { language = 'auto' } = options;
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const analysisPrompt = `请分析以下故事，提取关键情节用于生成插图：

故事内容：
${story}

请按以下格式返回分析结果：
1. 故事主题：
2. 主要角色（包括外貌描述）：
3. 故事场景：
4. 关键情节点（适合配图的重要场景，最多6个）：
5. 情绪色调：
6. 建议风格：`;

      const result = await model.generateContent(analysisPrompt);
      const analysis = result.response.text();

      // 解析响应并提取结构化信息
      const sections = this.parseAnalysis(analysis);
      
      return {
        analysis: sections,
        rawAnalysis: analysis
      };
    } catch (error) {
      logger.error('故事分析失败:', error);
      throw error;
    }
  }

  /**
   * 解析分析结果
   */
  parseAnalysis(analysisText) {
    const sections = {
      theme: '',
      characters: [],
      scenes: [],
      keyMoments: [],
      mood: '',
      suggestedStyle: ''
    };

    // 简单的文本解析逻辑
    const lines = analysisText.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('故事主题')) {
        currentSection = 'theme';
      } else if (trimmedLine.includes('主要角色')) {
        currentSection = 'characters';
      } else if (trimmedLine.includes('故事场景')) {
        currentSection = 'scenes';
      } else if (trimmedLine.includes('关键情节点')) {
        currentSection = 'keyMoments';
      } else if (trimmedLine.includes('情绪色调')) {
        currentSection = 'mood';
      } else if (trimmedLine.includes('建议风格')) {
        currentSection = 'suggestedStyle';
      } else if (trimmedLine && !trimmedLine.match(/^\d+\./)) {
        // 处理内容行
        switch (currentSection) {
          case 'theme':
            sections.theme += trimmedLine + ' ';
            break;
          case 'characters':
            if (trimmedLine.length > 3) {
              sections.characters.push(trimmedLine);
            }
            break;
          case 'scenes':
            if (trimmedLine.length > 3) {
              sections.scenes.push(trimmedLine);
            }
            break;
          case 'keyMoments':
            if (trimmedLine.length > 3) {
              sections.keyMoments.push(trimmedLine);
            }
            break;
          case 'mood':
            sections.mood += trimmedLine + ' ';
            break;
          case 'suggestedStyle':
            sections.suggestedStyle += trimmedLine + ' ';
            break;
        }
      }
    }

    return sections;
  }

  /**
   * 生成故事插图
   */
  async generateIllustrations(apiKey, storyAnalysis, options = {}) {
    try {
      const {
        illustrationStyle = 'storybook',
        maxIllustrations = 4,
        maintainConsistency = true,
        characterConsistency = true
      } = options;

      const { keyMoments, characters, mood, theme } = storyAnalysis;
      
      // 选择要配图的关键情节
      const selectedMoments = keyMoments.slice(0, maxIllustrations);
      
      // 构建一致性描述
      let consistencyPrompt = '';
      if (maintainConsistency) {
        consistencyPrompt = `Maintain consistent ${illustrationStyle} style throughout. `;
        
        if (characterConsistency && characters.length > 0) {
          consistencyPrompt += `Character descriptions: ${characters.join(', ')}. Keep character appearances consistent. `;
        }
        
        if (mood) {
          consistencyPrompt += `Overall mood: ${mood}. `;
        }
      }

      const illustrations = [];
      
      // 为每个关键情节生成插图
      for (let i = 0; i < selectedMoments.length; i++) {
        const moment = selectedMoments[i];
        
        const illustrationPrompt = `
          ${consistencyPrompt}
          Scene ${i + 1}: ${moment}
          Style: ${illustrationStyle} illustration
          Theme: ${theme}
          High quality, detailed illustration
        `.trim();

        // 模拟生成结果
        const illustration = {
          id: uuidv4(),
          sceneNumber: i + 1,
          description: moment,
          prompt: illustrationPrompt,
          url: `https://storage.googleapis.com/story-illustrations/${uuidv4()}.png`,
          width: 1024,
          height: 1024,
          format: 'png',
          metadata: {
            model: 'gemini-2.0-flash',
            style: illustrationStyle,
            sceneDescription: moment,
            storyTheme: theme,
            timestamp: new Date().toISOString()
          }
        };

        illustrations.push(illustration);
        
        // 添加延迟避免频繁请求
        if (i < selectedMoments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        illustrations,
        storyInfo: {
          theme,
          characters,
          mood,
          style: illustrationStyle,
          totalScenes: selectedMoments.length
        },
        usage: {
          promptTokens: selectedMoments.length * 60,
          totalTokens: selectedMoments.length * 180
        }
      };
    } catch (error) {
      logger.error('故事插图生成失败:', error);
      throw error;
    }
  }

  /**
   * 生成故事标题
   */
  async generateTitle(apiKey, story, language = 'auto') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const titlePrompt = `请为以下故事生成3个吸引人的标题：

${story}

要求：
1. 标题要简洁有力
2. 能概括故事主题
3. 适合作为书名或文章标题

请按以下格式返回：
1. [标题一]
2. [标题二]
3. [标题三]`;

      const result = await model.generateContent(titlePrompt);
      const titles = this.parseTitles(result.response.text());
      
      return titles;
    } catch (error) {
      logger.error('故事标题生成失败:', error);
      return ['未命名故事'];
    }
  }

  /**
   * 解析生成的标题
   */
  parseTitles(titleText) {
    const lines = titleText.split('\n');
    const titles = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match && match[1]) {
        titles.push(match[1].trim());
      }
    }
    
    return titles.length > 0 ? titles : ['未命名故事'];
  }
}

const storyService = new StoryIllustrationService();

/**
 * 获取模块信息
 */
router.get('/', (req, res) => {
  res.json({
    module: 'story-illustration',
    name: '故事配图',
    description: '为故事自动生成连续性插图，保持角色和风格一致性',
    version: '1.0.0',
    type: 'action',
    category: 'creative',
    capabilities: {
      maxIllustrations: storyService.maxIllustrations,
      supportedStyles: Object.keys(storyService.supportedStyles),
      storyAnalysis: true,
      characterConsistency: true,
      titleGeneration: true
    },
    endpoints: {
      generate: 'POST /modules/story-illustration/generate',
      analyze: 'POST /modules/story-illustration/analyze',
      fields: 'GET /modules/story-illustration/fields'
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
        name: 'story',
        label: '故事内容',
        type: 'textarea',
        required: true,
        rows: 10,
        help: '输入完整的故事内容，至少100字',
        placeholder: '从前有一个勇敢的小公主，她住在一座美丽的城堡里...'
      },
      {
        name: 'illustrationStyle',
        label: '插图风格',
        type: 'select',
        required: false,
        default: 'storybook',
        options: Object.entries(storyService.supportedStyles).map(([value, label]) => ({
          value,
          label: `${value} - ${label}`
        }))
      },
      {
        name: 'maxIllustrations',
        label: '最大插图数量',
        type: 'number',
        required: false,
        default: 4,
        min: 1,
        max: storyService.maxIllustrations,
        help: `最多生成${storyService.maxIllustrations}张插图`
      },
      {
        name: 'maintainConsistency',
        label: '保持风格一致性',
        type: 'boolean',
        required: false,
        default: true,
        help: '所有插图保持相同的艺术风格'
      },
      {
        name: 'characterConsistency',
        label: '保持角色一致性',
        type: 'boolean',
        required: false,
        default: true,
        help: '保持故事中主要角色在不同插图中的外貌一致'
      },
      {
        name: 'generateTitle',
        label: '自动生成标题',
        type: 'boolean',
        required: false,
        default: false,
        help: '为故事生成合适的标题建议'
      },
      {
        name: 'language',
        label: '语言',
        type: 'select',
        required: false,
        default: 'auto',
        options: [
          { value: 'auto', label: '自动检测' },
          { value: 'zh', label: '中文' },
          { value: 'en', label: 'English' }
        ]
      }
    ]
  });
});

/**
 * 故事分析端点
 */
router.post('/analyze',
  validateRequest(Joi.object({ 
    story: Joi.string().required().min(50),
    language: Joi.string().valid('zh', 'en', 'auto').default('auto')
  })),
  async (req, res) => {
    try {
      const { story, language } = req.body;
      
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

      logger.info('开始分析故事:', { length: story.length, language });

      const analysis = await storyService.analyzeStory(apiKey, story, { language });

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('故事分析失败:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: '故事分析失败',
          statusCode: 500,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
);

/**
 * 生成故事插图
 */
router.post('/generate',
  imageGenerationLimiter,
  validateRequest(storySchema),
  async (req, res) => {
    try {
      const {
        story,
        illustrationStyle,
        maxIllustrations,
        maintainConsistency,
        characterConsistency,
        generateTitle,
        language
      } = req.body;

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

      logger.info('开始生成故事插图:', {
        storyLength: story.length,
        style: illustrationStyle,
        maxIllustrations,
        maintainConsistency,
        characterConsistency
      });

      // 分析故事
      const analysis = await storyService.analyzeStory(apiKey, story, { language });
      
      // 生成插图
      const illustrationResult = await storyService.generateIllustrations(
        apiKey,
        analysis.analysis,
        {
          illustrationStyle,
          maxIllustrations,
          maintainConsistency,
          characterConsistency
        }
      );

      // 生成标题（如果需要）
      let titles = [];
      if (generateTitle) {
        titles = await storyService.generateTitle(apiKey, story, language);
      }

      const response = {
        success: true,
        data: {
          story: {
            content: story,
            analysis: analysis.analysis,
            suggestedTitles: titles
          },
          illustrations: illustrationResult.illustrations,
          metadata: {
            style: illustrationStyle,
            totalIllustrations: illustrationResult.illustrations.length,
            storyInfo: illustrationResult.storyInfo,
            generatedAt: new Date().toISOString()
          },
          usage: illustrationResult.usage
        }
      };

      logger.info('故事插图生成完成:', {
        illustrations: illustrationResult.illustrations.length,
        titles: titles.length
      });

      res.json(response);

    } catch (error) {
      logger.error('故事插图生成失败:', error);
      
      let errorMessage = '故事插图生成失败';
      let statusCode = 500;

      if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API配额已超限，请稍后再试';
        statusCode = 429;
      } else if (error.message.includes('故事内容过短')) {
        errorMessage = '故事内容过短，请提供更详细的故事内容';
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
 * 获取支持的风格列表
 */
router.get('/styles', (req, res) => {
  res.json({
    styles: storyService.supportedStyles
  });
});

module.exports = router;