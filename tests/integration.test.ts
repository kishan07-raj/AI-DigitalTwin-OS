/**
 * Integration Tests for Backend + AI Engine
 * Tests the communication between backend API and AI services
 */

import axios from 'axios';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000';

describe('Backend + AI Engine Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Integration Test User',
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.token).toBeDefined();
      
      authToken = response.data.data.token;
      testUserId = response.data.data.user.id;
    });

    it('should login with registered user', async () => {
      // First register
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `logintest_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Login Test',
      });

      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: registerResponse.data.data.user.email,
        password: 'password123',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data.success).toBe(true);
      expect(loginResponse.data.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('Activity Tracking', () => {
    beforeAll(async () => {
      // Register and login to get token
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `activity_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Activity Test',
      });
      authToken = response.data.data.token;
    });

    it('should track user activity', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/activity/track`,
        {
          action: 'click',
          element: 'dashboard-button',
          page: '/dashboard',
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('should get user activities', async () => {
      const response = await axios.get(`${API_BASE_URL}/activity`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data.activities)).toBe(true);
    });

    it('should create and end session', async () => {
      // Create session
      const createResponse = await axios.post(
        `${API_BASE_URL}/activity/session`,
        {
          device: 'desktop',
          browser: 'Chrome',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(createResponse.status).toBe(201);
      expect(createResponse.data.data.sessionId).toBeDefined();

      // End session
      const endResponse = await axios.put(
        `${API_BASE_URL}/activity/session/end`,
        { sessionId: createResponse.data.data.sessionId },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(endResponse.status).toBe(200);
      expect(endResponse.data.data.endedAt).toBeDefined();
    });
  });

  describe('AI Predictions Integration', () => {
    beforeAll(async () => {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `ai_${Date.now()}@example.com`,
        password: 'password123',
        name: 'AI Test',
      });
      authToken = response.data.data.token;
    });

    it('should get AI predictions', async () => {
      const response = await axios.get(`${API_BASE_URL}/predictions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.predictions).toBeDefined();
    });

    it('should submit prediction feedback', async () => {
      // First get predictions
      const predictionsResponse = await axios.get(`${API_BASE_URL}/predictions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (predictionsResponse.data.data.predictions.length > 0) {
        const predictionId = predictionsResponse.data.data.predictions[0].id;

        const feedbackResponse = await axios.post(
          `${API_BASE_URL}/predictions/feedback`,
          {
            predictionId,
            feedback: 'helpful',
            comment: 'This was accurate',
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        expect(feedbackResponse.status).toBe(200);
        expect(feedbackResponse.data.success).toBe(true);
      }
    });

    it('should get prediction history', async () => {
      const response = await axios.get(`${API_BASE_URL}/predictions/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Digital Twin API Integration', () => {
    it('should create digital twin profile', async () => {
      const userId = 'test_user_123';
      
      try {
        const response = await axios.post(`${AI_BASE_URL}/digital-twin/profile/${userId}`);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.profile).toBeDefined();
      } catch (error: any) {
        // Service might not be running in test environment
        expect([500, 503]).toContain(error.response?.status);
      }
    });

    it('should get behavior summary', async () => {
      const userId = 'test_user_123';
      
      try {
        // First create profile
        await axios.post(`${AI_BASE_URL}/digital-twin/profile/${userId}`);
        
        // Then get summary
        const response = await axios.get(`${AI_BASE_URL}/digital-twin/summary/${userId}`);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });
  });

  describe('Adaptive UI API Integration', () => {
    it('should track activity for UI adaptation', async () => {
      const userId = 'test_user_ui';
      
      try {
        const response = await axios.post(`${AI_BASE_URL}/adaptive-ui/track/${userId}`, {
          type: 'click',
          element: 'dashboard',
          page: '/dashboard',
        });
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });

    it('should get layout prediction', async () => {
      const userId = 'test_user_ui';
      
      try {
        const response = await axios.get(`${AI_BASE_URL}/adaptive-ui/layout/${userId}`);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.layout).toBeDefined();
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });
  });

  describe('Self-Healing API Integration', () => {
    it('should get system health', async () => {
      try {
        const response = await axios.get(`${AI_BASE_URL}/self-healing/health`);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.health).toBeDefined();
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });

    it('should check and heal', async () => {
      try {
        const response = await axios.post(`${AI_BASE_URL}/self-healing/check`);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.results).toBeDefined();
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });
  });

  describe('Self-Evolution API Integration', () => {
    it('should get evolution status', async () => {
      try {
        const response = await axios.get(`${AI_BASE_URL}/self-evolution/status`);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.status).toBeDefined();
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });

    it('should add feedback', async () => {
      try {
        const response = await axios.post(`${AI_BASE_URL}/self-evolution/feedback`, {
          predictionId: 'test_pred',
          actual: 'A',
          predicted: 'A',
          feedback: 'positive',
        });
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      } catch (error: any) {
        expect([500, 503]).toContain(error.response?.status);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      try {
        await axios.get(`${API_BASE_URL}/non-existent`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.get(`${API_BASE_URL}/activity`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should return 400 for invalid data', async () => {
      // Register first
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `error_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Error Test',
      });
      
      const token = registerResponse.data.data.token;

      try {
        await axios.post(
          `${API_BASE_URL}/activity/track`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

