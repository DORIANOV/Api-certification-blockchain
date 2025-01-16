const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { app } = require('../../src/app');
const { db } = require('../../src/db');
const { createTestUser, createAuthToken, createTestTemplate } = require('../helpers');
const config = require('../../src/config');

describe('Reports Security Tests', () => {
  let testUser;
  let authToken;
  let templateId;
  let server;

  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'security@example.com',
      password: 'StrongP@ssw0rd123',
      role: 'admin'
    });
    authToken = await createAuthToken(testUser);
    const template = await createTestTemplate(testUser.id);
    templateId = template.id;
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
  });

  describe('Authentication Security', () => {
    it('prevents unauthorized access', async () => {
      const response = await request(app)
        .get('/api/report-templates');

      expect(response.status).toBe(401);
    });

    it('rejects invalid tokens', async () => {
      const invalidToken = 'invalid.token.here';
      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it('rejects expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        config.jwtSecret,
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('prevents brute force attacks', async () => {
      const attempts = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'security@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(attempts);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body).toHaveProperty('retryAfter');
    });
  });

  describe('Authorization Security', () => {
    let regularUser;
    let regularUserToken;

    beforeAll(async () => {
      regularUser = await createTestUser({
        email: 'regular@example.com',
        password: 'StrongP@ssw0rd123',
        role: 'user'
      });
      regularUserToken = await createAuthToken(regularUser);
    });

    it('enforces role-based access control', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });

    it('prevents unauthorized template access', async () => {
      const response = await request(app)
        .get(`/api/report-templates/${templateId}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
    });

    it('enforces data isolation between users', async () => {
      const template = await createTestTemplate(regularUser.id);
      
      const response = await request(app)
        .get(`/api/report-templates/${template.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation Security', () => {
    it('prevents SQL injection', async () => {
      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          search: "'; DROP TABLE users; --"
        });

      expect(response.status).toBe(400);
    });

    it('sanitizes template configuration', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '<script>alert("xss")</script>Template',
          config: {
            sections: [{
              type: 'text',
              content: '<script>alert("xss")</script>'
            }]
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.name).not.toContain('<script>');
      expect(response.body.config.sections[0].content).not.toContain('<script>');
    });

    it('validates file uploads', async () => {
      const response = await request(app)
        .post('/api/report-templates/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('template', Buffer.from('fake pdf content'), {
          filename: 'template.exe',
          contentType: 'application/x-msdownload'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('enforces API rate limits', async () => {
      const requests = Array(100).fill().map(() =>
        request(app)
          .get('/api/report-templates')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);

      expect(tooManyRequests.length).toBeGreaterThan(0);
    });

    it('applies different limits per endpoint', async () => {
      const requests = Array(20).fill().map(() =>
        request(app)
          .post('/api/report-templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Template',
            type: 'works'
          })
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);

      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Data Security', () => {
    it('encrypts sensitive data', async () => {
      const template = await createTestTemplate(testUser.id, {
        credentials: {
          apiKey: 'secret-key-123'
        }
      });

      const result = await db.query(
        'SELECT config FROM report_templates WHERE id = $1',
        [template.id]
      );

      expect(result.rows[0].config.credentials.apiKey).not.toBe('secret-key-123');
    });

    it('masks sensitive data in responses', async () => {
      const response = await request(app)
        .get(`/api/report-templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).not.toHaveProperty('config.credentials');
    });

    it('prevents mass assignment', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Template',
          created_by: regularUser.id,
          role: 'admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.created_by).toBe(testUser.id);
      expect(response.body).not.toHaveProperty('role');
    });
  });

  describe('Session Security', () => {
    it('invalidates old sessions on password change', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'StrongP@ssw0rd123',
          newPassword: 'NewStrongP@ssw0rd123'
        });

      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(401);
    });

    it('prevents concurrent sessions', async () => {
      const token1 = await createAuthToken(testUser);
      const token2 = await createAuthToken(testUser);

      const response1 = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${token1}`);

      expect(response1.status).toBe(401);
    });
  });

  describe('Audit Security', () => {
    it('logs security events', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security@example.com',
          password: 'wrongpassword'
        });

      const logs = await db.query(
        'SELECT * FROM security_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [testUser.id]
      );

      expect(logs.rows[0]).toMatchObject({
        event_type: 'failed_login',
        ip_address: expect.any(String),
        user_agent: expect.any(String)
      });
    });

    it('tracks suspicious activities', async () => {
      const suspiciousTemplates = Array(10).fill().map(() =>
        request(app)
          .post('/api/report-templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Suspicious Template',
            type: 'works',
            config: {
              sections: [{
                type: 'custom',
                script: 'console.log("suspicious")'
              }]
            }
          })
      );

      await Promise.all(suspiciousTemplates);

      const alerts = await db.query(
        'SELECT * FROM security_alerts WHERE user_id = $1 AND type = $2',
        [testUser.id, 'suspicious_activity']
      );

      expect(alerts.rows.length).toBeGreaterThan(0);
    });
  });
});
