const request = require('supertest');
const { app } = require('../../src/app');
const { db } = require('../../src/db');
const { createTestUser, createAuthToken } = require('../helpers');

describe('Report Templates API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });
    authToken = await createAuthToken(testUser);
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await db.query('DELETE FROM report_templates WHERE created_by = $1', [testUser.id]);
    await db.query('DELETE FROM scheduled_reports WHERE created_by = $1', [testUser.id]);
  });

  describe('POST /api/report-templates', () => {
    it('creates a new report template', async () => {
      const template = {
        name: 'Test Template',
        description: 'Test Description',
        type: 'works',
        config: {
          sections: [
            {
              type: 'summary',
              title: 'Overview',
              metrics: ['total_works', 'new_works']
            },
            {
              type: 'chart',
              title: 'Trend',
              chartType: 'line',
              data: { query: 'works_trend' }
            }
          ],
          filters: {
            period: '1M',
            category: 'image'
          }
        }
      };

      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(template);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...template,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: testUser.id
      });
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('name is required');
      expect(response.body.errors).toContain('type is required');
      expect(response.body.errors).toContain('config is required');
    });
  });

  describe('GET /api/report-templates', () => {
    it('lists all templates', async () => {
      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        type: expect.any(String)
      });
    });

    it('filters templates by type', async () => {
      const response = await request(app)
        .get('/api/report-templates?type=works')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(template => template.type === 'works')).toBe(true);
    });
  });

  describe('GET /api/report-templates/:id/preview', () => {
    let templateId;

    beforeAll(async () => {
      const template = {
        name: 'Preview Test',
        type: 'works',
        config: {
          sections: [
            {
              type: 'summary',
              metrics: ['total_works']
            }
          ],
          filters: { period: '1M' }
        }
      };

      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(template);

      templateId = response.body.id;
    });

    it('generates preview data', async () => {
      const response = await request(app)
        .get(`/api/report-templates/${templateId}/preview`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: expect.any(String),
        sections: expect.arrayContaining([
          expect.objectContaining({
            type: 'summary',
            data: expect.any(Object)
          })
        ])
      });
    });

    it('handles invalid template ID', async () => {
      const response = await request(app)
        .get('/api/report-templates/999999/preview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});

describe('Scheduled Reports API', () => {
  let testUser;
  let authToken;
  let templateId;

  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'scheduler@example.com',
      password: 'password123',
      role: 'admin'
    });
    authToken = await createAuthToken(testUser);

    // Create a template for testing
    const template = {
      name: 'Schedule Test',
      type: 'works',
      config: {
        sections: [{ type: 'summary', metrics: ['total_works'] }],
        filters: { period: '1M' }
      }
    };

    const response = await request(app)
      .post('/api/report-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(template);

    templateId = response.body.id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await db.query('DELETE FROM report_templates WHERE created_by = $1', [testUser.id]);
    await db.query('DELETE FROM scheduled_reports WHERE created_by = $1', [testUser.id]);
  });

  describe('POST /api/scheduled-reports', () => {
    it('creates a new scheduled report', async () => {
      const schedule = {
        name: 'Monthly Works Report',
        template_id: templateId,
        cron: '0 9 1 * *',
        recipients: ['test@example.com'],
        enabled: true
      };

      const response = await request(app)
        .post('/api/scheduled-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(schedule);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...schedule,
        created_at: expect.any(String),
        next_run: expect.any(String)
      });
    });

    it('validates cron expression', async () => {
      const response = await request(app)
        .post('/api/scheduled-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Schedule',
          template_id: templateId,
          cron: 'invalid',
          recipients: ['test@example.com']
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('invalid cron expression');
    });
  });

  describe('GET /api/scheduled-reports', () => {
    it('lists all scheduled reports', async () => {
      const response = await request(app)
        .get('/api/scheduled-reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        template_id: expect.any(Number),
        cron: expect.any(String)
      });
    });
  });

  describe('POST /api/scheduled-reports/:id/execute', () => {
    let reportId;

    beforeAll(async () => {
      const schedule = {
        name: 'Test Execution',
        template_id: templateId,
        cron: '0 9 * * *',
        recipients: ['test@example.com']
      };

      const response = await request(app)
        .post('/api/scheduled-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(schedule);

      reportId = response.body.id;
    });

    it('executes report on demand', async () => {
      const response = await request(app)
        .post(`/api/scheduled-reports/${reportId}/execute`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        execution_id: expect.any(String)
      });
    });

    it('handles invalid report ID', async () => {
      const response = await request(app)
        .post('/api/scheduled-reports/999999/execute')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/scheduled-reports/:id', () => {
    let reportId;

    beforeAll(async () => {
      const schedule = {
        name: 'Update Test',
        template_id: templateId,
        cron: '0 9 * * *',
        recipients: ['test@example.com']
      };

      const response = await request(app)
        .post('/api/scheduled-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(schedule);

      reportId = response.body.id;
    });

    it('updates schedule configuration', async () => {
      const updates = {
        name: 'Updated Schedule',
        cron: '0 10 * * *',
        recipients: ['new@example.com'],
        enabled: false
      };

      const response = await request(app)
        .put(`/api/scheduled-reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: reportId,
        ...updates,
        next_run: expect.any(String)
      });
    });
  });
});
