const request = require('supertest');
const app = require('../src/index');

describe('Image Generation Module', () => {
  const validApiKey = 'test-api-key';
  
  describe('POST /modules/generate-image/generate', () => {
    it('should generate image with valid prompt', async () => {
      const imageRequest = {
        prompt: '一只可爱的小猫在花园里玩耍',
        model: 'gemini-2.0-flash-preview-image-generation',
        resolution: '1024x1024',
        style: 'realistic',
        imageCount: 1
      };

      const response = await request(app)
        .post('/modules/generate-image/generate')
        .set('x-api-key', validApiKey)
        .send(imageRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('images');
      expect(Array.isArray(response.body.data.images)).toBe(true);
      expect(response.body.data.images).toHaveLength(1);
      
      const image = response.body.data.images[0];
      expect(image).toHaveProperty('id');
      expect(image).toHaveProperty('url');
      expect(image).toHaveProperty('width', 1024);
      expect(image).toHaveProperty('height', 1024);
    });

    it('should reject empty prompt', async () => {
      const invalidRequest = {
        prompt: '',
        model: 'gemini-2.0-flash-preview-image-generation'
      };

      const response = await request(app)
        .post('/modules/generate-image/generate')
        .set('x-api-key', validApiKey)
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should reject request without API key', async () => {
      const imageRequest = {
        prompt: '一只可爱的小猫'
      };

      const response = await request(app)
        .post('/modules/generate-image/generate')
        .send(imageRequest)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('API密钥');
    });

    it('should handle multiple image generation', async () => {
      const imageRequest = {
        prompt: '美丽的风景',
        imageCount: 3
      };

      const response = await request(app)
        .post('/modules/generate-image/generate')
        .set('x-api-key', validApiKey)
        .send(imageRequest)
        .expect(200);

      expect(response.body.data.images).toHaveLength(3);
    });

    it('should validate image count limits', async () => {
      const imageRequest = {
        prompt: '测试图片',
        imageCount: 10 // 超过限制
      };

      const response = await request(app)
        .post('/modules/generate-image/generate')
        .set('x-api-key', validApiKey)
        .send(imageRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /modules/generate-image/fields', () => {
    it('should return field definitions', async () => {
      const response = await request(app)
        .get('/modules/generate-image/fields')
        .expect(200);

      expect(response.body).toHaveProperty('fields');
      expect(Array.isArray(response.body.fields)).toBe(true);
      
      const promptField = response.body.fields.find(f => f.name === 'prompt');
      expect(promptField).toBeTruthy();
      expect(promptField.required).toBe(true);
    });
  });

  describe('GET /modules/generate-image/models', () => {
    it('should return supported models', async () => {
      const response = await request(app)
        .get('/modules/generate-image/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(typeof response.body.models).toBe('object');
    });
  });
});