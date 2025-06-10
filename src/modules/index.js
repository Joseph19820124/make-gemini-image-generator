const express = require('express');
const generateImage = require('./generateImage');
const editImage = require('./editImage');
const batchGenerate = require('./batchGenerate');
const storyIllustration = require('./storyIllustration');

const router = express.Router();

// 注册所有模块
router.use('/generate-image', generateImage);
router.use('/edit-image', editImage);
router.use('/batch-generate', batchGenerate);
router.use('/story-illustration', storyIllustration);

// 模块列表
router.get('/', (req, res) => {
  res.json({
    modules: [
      {
        id: 'generate-image',
        name: '生成图片',
        description: '根据文本描述生成图片',
        type: 'action',
        category: 'image-generation'
      },
      {
        id: 'edit-image', 
        name: '编辑图片',
        description: '基于自然语言编辑现有图片',
        type: 'action',
        category: 'image-editing'
      },
      {
        id: 'batch-generate',
        name: '批量生成',
        description: '批量生成多张图片',
        type: 'action',
        category: 'batch-processing'
      },
      {
        id: 'story-illustration',
        name: '故事配图',
        description: '为故事生成连续性插图',
        type: 'action',
        category: 'creative'
      }
    ]
  });
});

module.exports = router;