// Jest setup file
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('../src/utils/logger');

// Mock Google AI API for testing
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => '模拟响应文本',
              candidates: [{
                content: {
                  parts: [{ text: '模拟响应文本' }]
                }
              }]
            }
          })
        })
      };
    })
  };
});

// Mock sharp for image processing
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 1024,
      height: 1024,
      format: 'png',
      size: 1048576
    }),
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    sharpen: jest.fn().mockReturnThis(),
    median: jest.fn().mockReturnThis(),
    composite: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock image data'))
  }));
  
  return mockSharp;
});

// Mock axios for HTTP requests
jest.mock('axios', () => {
  return {
    __esModule: true,
    default: jest.fn(() => Promise.resolve({
      data: Buffer.from('mock image data'),
      status: 200
    }))
  };
});

// Suppress console logs during testing
if (process.env.NODE_ENV === 'test') {
  logger.level = 'error';
}

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  process.env.LOG_LEVEL = 'error';
});

afterAll(async () => {
  // Cleanup
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});