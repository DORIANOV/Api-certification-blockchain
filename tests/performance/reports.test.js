const autocannon = require('autocannon');
const { promisify } = require('util');
const { app } = require('../../src/app');
const { createTestUser, createAuthToken, createTestTemplate, cleanupTestData } = require('../helpers');
const { db } = require('../../src/db');

// Convertir autocannon en promesse
const autocannonAsync = promisify(autocannon);

// Configuration du serveur de test
const server = app.listen(0);
const { port } = server.address();
const baseUrl = `http://localhost:${port}`;

describe('Reports Performance Tests', () => {
  let testUser;
  let authToken;
  let templateId;

  beforeAll(async () => {
    // Créer un utilisateur de test et des données
    testUser = await createTestUser({
      email: 'perf@example.com',
      password: 'password123',
      role: 'admin'
    });
    authToken = await createAuthToken(testUser);

    // Créer un modèle de test
    const template = await createTestTemplate(testUser.id);
    templateId = template.id;

    // Créer plusieurs rapports programmés
    const schedules = [];
    for (let i = 0; i < 100; i++) {
      schedules.push({
        name: `Schedule ${i}`,
        template_id: templateId,
        cron: '0 9 * * *',
        recipients: ['test@example.com'],
        enabled: true,
        created_by: testUser.id
      });
    }

    await db.query(
      `INSERT INTO scheduled_reports 
       (name, template_id, cron, recipients, enabled, created_by)
       SELECT * FROM UNNEST ($1::text[], $2::int[], $3::text[], $4::text[][], $5::boolean[], $6::int[])`,
      [
        schedules.map(s => s.name),
        schedules.map(s => s.template_id),
        schedules.map(s => s.cron),
        schedules.map(s => s.recipients),
        schedules.map(s => s.enabled),
        schedules.map(s => s.created_by)
      ]
    );
  });

  afterAll(async () => {
    await cleanupTestData();
    await server.close();
  });

  describe('Template Preview Performance', () => {
    it('handles multiple concurrent preview requests', async () => {
      const result = await autocannonAsync({
        url: `${baseUrl}/api/report-templates/${templateId}/preview`,
        connections: 100,
        duration: 10,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      expect(result.non2xx).toBe(0);
      expect(result.latency.p99).toBeLessThan(1000); // 99th percentile should be under 1s
    });
  });

  describe('Scheduled Reports List Performance', () => {
    it('handles pagination efficiently', async () => {
      const result = await autocannonAsync({
        url: `${baseUrl}/api/scheduled-reports?page=1&limit=20`,
        connections: 50,
        duration: 10,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      expect(result.latency.median).toBeLessThan(100); // Median latency under 100ms
    });
  });

  describe('Report Generation Performance', () => {
    it('handles concurrent report generation requests', async () => {
      const result = await autocannonAsync({
        url: `${baseUrl}/api/scheduled-reports/generate-batch`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateId,
          count: 10
        }),
        connections: 20,
        duration: 20
      });

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      expect(result.latency.p95).toBeLessThan(5000); // 95th percentile under 5s
    });
  });

  describe('Template Search Performance', () => {
    it('handles complex search queries efficiently', async () => {
      const result = await autocannonAsync({
        url: `${baseUrl}/api/report-templates/search?q=test&type=works&sort=created_at&order=desc`,
        connections: 50,
        duration: 10,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      expect(result.latency.average).toBeLessThan(200); // Average under 200ms
    });
  });
});
