const { app } = require('../../src/app');
const { db } = require('../../src/db');
const { createTestUser, createAuthToken, createTestTemplate } = require('../helpers');
const { mockSmtp, restoreSmtp } = require('../mocks/smtp');
const { mockRedis, restoreRedis } = require('../mocks/redis');
const { mockQueue, restoreQueue } = require('../mocks/queue');
const request = require('supertest');
const nock = require('nock');
const sinon = require('sinon');

describe('Reports System Resilience Tests', () => {
  let testUser;
  let authToken;
  let templateId;
  let server;

  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'resilience@example.com',
      password: 'password123',
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

  describe('Database Resilience', () => {
    it('handles database connection loss gracefully', async () => {
      // Simuler une perte de connexion à la base de données
      const dbPool = await db.getPool();
      await dbPool.end();

      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        error: 'Service temporarily unavailable',
        retryAfter: expect.any(Number)
      });

      // Rétablir la connexion
      await db.connect();
    });

    it('retries failed database operations', async () => {
      const queryStub = sinon.stub(db, 'query');
      queryStub.onFirstCall().rejects(new Error('Connection lost'));
      queryStub.onSecondCall().resolves({ rows: [] });

      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(queryStub.callCount).toBe(2);

      queryStub.restore();
    });
  });

  describe('Cache Resilience', () => {
    beforeEach(() => {
      mockRedis();
    });

    afterEach(() => {
      restoreRedis();
    });

    it('continues working when Redis is down', async () => {
      // Simuler une panne Redis
      const redis = require('../../src/services/cache');
      redis.client.emit('error', new Error('Redis connection lost'));

      const response = await request(app)
        .get(`/api/report-templates/${templateId}/preview`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('recovers cache after Redis reconnects', async () => {
      const redis = require('../../src/services/cache');
      
      // Simuler une déconnexion
      redis.client.emit('error', new Error('Redis connection lost'));
      
      // Simuler une reconnexion
      redis.client.emit('ready');

      const response = await request(app)
        .get(`/api/report-templates/${templateId}/preview`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['x-cache']).toBe('MISS');

      // Deuxième requête devrait utiliser le cache
      const secondResponse = await request(app)
        .get(`/api/report-templates/${templateId}/preview`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.headers['x-cache']).toBe('HIT');
    });
  });

  describe('Queue Resilience', () => {
    beforeEach(() => {
      mockQueue();
    });

    afterEach(() => {
      restoreQueue();
    });

    it('handles queue service outage', async () => {
      // Simuler une panne du service de queue
      const queue = require('../../src/services/queue');
      queue.emit('error', new Error('Queue service unavailable'));

      const response = await request(app)
        .post(`/api/scheduled-reports/${templateId}/execute`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'queued',
        fallback: 'immediate'
      });
    });

    it('requeues failed jobs', async () => {
      const queue = require('../../src/services/queue');
      const job = {
        id: 'test-job',
        data: { templateId, recipients: ['test@example.com'] }
      };

      // Simuler un échec de job
      queue.emit('failed', job, new Error('Processing failed'));

      // Vérifier que le job est replanifié
      const jobs = await queue.getJobs(['waiting']);
      expect(jobs.some(j => j.id === 'test-job')).toBe(true);
    });
  });

  describe('Email Service Resilience', () => {
    beforeEach(() => {
      mockSmtp();
    });

    afterEach(() => {
      restoreSmtp();
    });

    it('handles SMTP server failures', async () => {
      const mailer = require('../../src/services/mailer');
      mailer.emit('error', new Error('SMTP connection failed'));

      const response = await request(app)
        .post('/api/scheduled-reports/notify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipients: ['test@example.com'],
          reportId: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'queued',
        retryCount: expect.any(Number)
      });
    });

    it('retries failed email deliveries', async () => {
      const mailer = require('../../src/services/mailer');
      const sendMailStub = sinon.stub(mailer, 'sendMail');
      sendMailStub.onFirstCall().rejects(new Error('Delivery failed'));
      sendMailStub.onSecondCall().resolves();

      const response = await request(app)
        .post('/api/scheduled-reports/notify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipients: ['test@example.com'],
          reportId: 1
        });

      expect(response.status).toBe(200);
      expect(sendMailStub.callCount).toBe(2);

      sendMailStub.restore();
    });
  });

  describe('External Services Resilience', () => {
    beforeEach(() => {
      nock.disableNetConnect();
      nock.enableNetConnect('127.0.0.1');
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    it('handles external API failures', async () => {
      // Simuler une API externe
      nock('https://api.external-service.com')
        .get('/data')
        .reply(500);

      const response = await request(app)
        .get('/api/report-templates/external-data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        source: 'fallback'
      });
    });

    it('implements circuit breaker for external services', async () => {
      // Simuler plusieurs échecs consécutifs
      nock('https://api.external-service.com')
        .get('/data')
        .times(5)
        .reply(500);

      // Première requête - devrait essayer
      await request(app)
        .get('/api/report-templates/external-data')
        .set('Authorization', `Bearer ${authToken}`);

      // Deuxième requête - circuit breaker devrait être ouvert
      const response = await request(app)
        .get('/api/report-templates/external-data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        source: 'cache',
        circuitBreaker: 'open'
      });
    });
  });

  describe('Concurrent Access Resilience', () => {
    it('handles concurrent template updates', async () => {
      const updates = Array(10).fill().map(() => 
        request(app)
          .put(`/api/report-templates/${templateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated Template' })
      );

      const responses = await Promise.all(updates);
      const successCount = responses.filter(r => r.status === 200).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(9);
    });

    it('maintains data consistency under load', async () => {
      const operations = Array(100).fill().map(() => 
        request(app)
          .post('/api/scheduled-reports')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            templateId,
            name: 'Concurrent Schedule',
            cron: '0 9 * * *'
          })
      );

      const responses = await Promise.all(operations);
      const createdReports = responses.filter(r => r.status === 201);

      // Vérifier qu'il n'y a pas de doublons
      const reportIds = createdReports.map(r => r.body.id);
      const uniqueIds = new Set(reportIds);
      expect(reportIds.length).toBe(uniqueIds.size);
    });
  });
});
