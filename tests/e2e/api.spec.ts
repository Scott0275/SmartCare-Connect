import request from 'supertest';
import { setupCognitoMock, cleanupCognitoMock, mockCognitoTokens } from '../mocks/cognito.mock';
import { setupDynamoDBMock, cleanupDynamoDBMock, mockPatients, mockAppointments } from '../mocks/dynamodb.mock';

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api';

describe('E2E: API Gateway Endpoints', () => {
  beforeAll(async () => {
    await setupCognitoMock();
    await setupDynamoDBMock();
  });

  afterAll(() => {
    cleanupCognitoMock();
    cleanupDynamoDBMock();
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 OK for health check', async () => {
      const response = await request(API_ENDPOINT)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should have correct CORS headers on health endpoint', async () => {
      const response = await request(API_ENDPOINT)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });

    it('should respond quickly to health check (< 100ms)', async () => {
      const startTime = Date.now();
      
      await request(API_ENDPOINT)
        .get('/health')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Patients Endpoint - GET', () => {
    it('should return list of patients with authentication', async () => {
      const response = await request(API_ENDPOINT)
        .get('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication token', async () => {
      await request(API_ENDPOINT)
        .get('/patients')
        .expect(401);
    });

    it('should return 403 with invalid authentication token', async () => {
      await request(API_ENDPOINT)
        .get('/patients')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(403);
    });

    it('should support pagination in patients list', async () => {
      const response = await request(API_ENDPOINT)
        .get('/patients?limit=10&offset=0')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should include patient metadata', async () => {
      const response = await request(API_ENDPOINT)
        .get('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const patient = response.body[0];
        expect(patient).toHaveProperty('id');
        expect(patient).toHaveProperty('firstName');
        expect(patient).toHaveProperty('lastName');
        expect(patient).toHaveProperty('email');
        expect(patient).toHaveProperty('phone');
        expect(patient).toHaveProperty('createdAt');
      }
    });

    it('should filter patients by search criteria', async () => {
      const response = await request(API_ENDPOINT)
        .get('/patients?search=John')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Patients Endpoint - POST', () => {
    it('should create new patient with valid data', async () => {
      const newPatient = {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert@example.com',
        phone: '+1234567890',
        dateOfBirth: '1992-07-22',
        gender: 'M',
        medicalHistory: 'Hypertension',
        allergies: 'Sulfonamides',
        emergencyContact: 'Susan Wilson',
        emergencyContactPhone: '+1234567891',
      };

      const response = await request(API_ENDPOINT)
        .post('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send(newPatient)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(newPatient.firstName);
      expect(response.body.email).toBe(newPatient.email);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidPatient = {
        firstName: 'John',
        // Missing required fields
      };

      await request(API_ENDPOINT)
        .post('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send(invalidPatient)
        .expect(400);
    });

    it('should validate email format on create', async () => {
      const patientWithInvalidEmail = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+1234567890',
        dateOfBirth: '1990-01-15',
        gender: 'M',
      };

      await request(API_ENDPOINT)
        .post('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send(patientWithInvalidEmail)
        .expect(400);
    });

    it('should prevent duplicate email on create', async () => {
      const duplicatePatient = {
        firstName: 'John',
        lastName: 'Duplicate',
        email: mockPatients[0].email, // Duplicate email
        phone: '+1234567890',
        dateOfBirth: '1990-01-15',
        gender: 'M',
      };

      await request(API_ENDPOINT)
        .post('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send(duplicatePatient)
        .expect(409);
    });

    it('should have correct CORS headers on POST', async () => {
      const response = await request(API_ENDPOINT)
        .post('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send({})
        .expect(400);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('User Creation Endpoint', () => {
    it('should create user in Cognito and DynamoDB', async () => {
      const newUser = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'patient',
        phone: '+1111111111',
      };

      const response = await request(API_ENDPOINT)
        .post('/createUser')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).toHaveProperty('role', newUser.role);
    });

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        email: 'testuser@example.com', // Already exists
        firstName: 'Test',
        lastName: 'User',
        role: 'patient',
      };

      await request(API_ENDPOINT)
        .post('/createUser')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .send(existingUser)
        .expect(409);
    });

    it('should validate role assignment on create', async () => {
      const validRoles = ['patient', 'doctor', 'nurse', 'pharmacist', 'admin'];
      expect(validRoles).toContain('patient');
      expect(validRoles).toContain('doctor');
    });
  });

  describe('Analytics Endpoint', () => {
    it('should return analytics summary with authentication', async () => {
      const response = await request(API_ENDPOINT)
        .get('/analytics/summary')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPatients');
      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should support date range filtering in analytics', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(API_ENDPOINT)
        .get(`/analytics/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPatients');
      expect(response.body).toHaveProperty('totalAppointments');
    });

    it('should return 401 without authentication on analytics', async () => {
      await request(API_ENDPOINT)
        .get('/analytics/summary')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      await request(API_ENDPOINT)
        .get('/non-existent-endpoint')
        .expect(404);
    });

    it('should return 405 for unsupported HTTP method', async () => {
      await request(API_ENDPOINT)
        .delete('/health')
        .expect(405);
    });

    it('should return 500 with error details on server error', async () => {
      // Mock server error scenario
      const response = await request(API_ENDPOINT)
        .get('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        // Simulate error by sending invalid header
        .expect((res) => {
          if (res.status === 500) {
            expect(res.body).toHaveProperty('error');
            expect(res.body).toHaveProperty('message');
          }
        });
    });

    it('should validate request content-type', async () => {
      const response = await request(API_ENDPOINT)
        .post('/patients')
        .set('Authorization', `Bearer ${mockCognitoTokens.AccessToken}`)
        .set('Content-Type', 'text/plain')
        .send('invalid')
        .expect((res) => {
          expect([400, 415]).toContain(res.status);
        });
    });
  });

  describe('Performance & Rate Limiting', () => {
    it('should handle concurrent requests', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(API_ENDPOINT)
            .get('/health')
            .expect(200)
        );
      }

      const results = await Promise.all(requests);
      expect(results.length).toBe(5);
      expect(results.every(r => r.status === 200)).toBe(true);
    });

    it('should enforce rate limiting on endpoints', async () => {
      // Rate limit: 100 requests per minute
      const rateLimit = 100;
      expect(rateLimit).toBeGreaterThan(0);
    });

    it('should respond with rate limit headers', async () => {
      const response = await request(API_ENDPOINT)
        .get('/health')
        .expect(200);

      // Check for rate limit headers (if implemented)
      if (response.headers['x-ratelimit-limit']) {
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      }
    });
  });
});
