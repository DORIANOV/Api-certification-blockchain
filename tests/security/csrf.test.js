const request = require('supertest');
const { app } = require('../../src/app');
const { createTestUser, createAuthToken } = require('../helpers');

describe('CSRF Protection Tests', () => {
  let testUser;
  let authToken;
  let csrfToken;
  let server;

  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'csrf@example.com',
      password: 'StrongP@ssw0rd123',
      role: 'admin'
    });
    authToken = await createAuthToken(testUser);
    server = app.listen(0);
  });

  beforeEach(async () => {
    // Obtenir un nouveau token CSRF
    const response = await request(app)
      .get('/api/csrf-token')
      .set('Authorization', `Bearer ${authToken}`);
    
    csrfToken = response.body.token;
  });

  afterAll(async () => {
    await server.close();
  });

  describe('CSRF Token Validation', () => {
    it('requires CSRF token for mutations', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });

    it('accepts valid CSRF token', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(201);
    });

    it('rejects invalid CSRF token', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'invalid-token')
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });

    it('rejects expired CSRF token', async () => {
      // Attendre que le token expire
      await new Promise(resolve => setTimeout(resolve, 3600000));

      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('CSRF Protection Features', () => {
    it('uses SameSite cookies', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
    });

    it('sets secure flag on cookies', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['set-cookie'][0]).toContain('Secure');
    });

    it('validates origin header', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Origin', 'https://malicious-site.com')
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });

    it('validates referer header', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Referer', 'https://malicious-site.com')
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Double Submit Cookie Pattern', () => {
    it('validates token matches cookie', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', `csrf=${csrfToken}`)
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(201);
    });

    it('rejects mismatched token and cookie', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', 'csrf=different-token')
        .send({
          name: 'Test Template',
          type: 'works'
        });

      expect(response.status).toBe(403);
    });
  });
});
