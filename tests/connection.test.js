const request = require('supertest');
const app = require('../src/index');

describe('Connection Module', () => {
  describe('POST /connection/test', () => {
    it('should validate API key successfully', async () => {
      const validConnection = {
        apiKey: 'test-api-key',
        region: 'us-central1'
      };

      const response = await request(app)
        .post('/connection/test')
        .send(validConnection)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body.capabilities).toHaveProperty('textGeneration', true);
    });

    it('should reject empty API key', async () => {
      const invalidConnection = {
        apiKey: '',
        region: 'us-central1'
      };

      const response = await request(app)
        .post('/connection/test')
        .send(invalidConnection)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should use default region when not specified', async () => {
      const connection = {
        apiKey: 'test-api-key'
      };

      const response = await request(app)
        .post('/connection/test')
        .send(connection)
        .expect(200);

      expect(response.body).toHaveProperty('region', 'us-central1');
    });
  });

  describe('GET /connection/fields', () => {
    it('should return connection field definitions', async () => {
      const response = await request(app)
        .get('/connection/fields')
        .expect(200);

      expect(response.body).toHaveProperty('fields');
      expect(Array.isArray(response.body.fields)).toBe(true);
      
      const apiKeyField = response.body.fields.find(f => f.name === 'apiKey');
      expect(apiKeyField).toBeTruthy();
      expect(apiKeyField.required).toBe(true);
      expect(apiKeyField.type).toBe('password');
    });
  });

  describe('GET /connection/models', () => {
    it('should return supported models', async () => {
      const response = await request(app)
        .get('/connection/models')
        .expect(200);

      expect(response.body).toHaveProperty('textGeneration');
      expect(response.body).toHaveProperty('imageGeneration');
      expect(Array.isArray(response.body.textGeneration)).toBe(true);
      expect(Array.isArray(response.body.imageGeneration)).toBe(true);
    });
  });
});