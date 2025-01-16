const request = require('supertest');
const { JSDOM } = require('jsdom');
const { app } = require('../../src/app');
const { createTestUser, createAuthToken } = require('../helpers');

describe('XSS Protection Tests', () => {
  let testUser;
  let authToken;
  let server;

  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'xss@example.com',
      password: 'StrongP@ssw0rd123',
      role: 'admin'
    });
    authToken = await createAuthToken(testUser);
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Input Sanitization', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">',
      '<svg onload="alert(\'xss\')">',
      '"><script>alert("xss")</script>',
      '\'; alert(\'xss\'); //',
      '<iframe src="javascript:alert(\'xss\')">',
      '<a href="javascript:alert(\'xss\')">click me</a>'
    ];

    test.each(xssPayloads)('sanitizes XSS payload: %s', async (payload) => {
      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Template ${payload}`,
          description: `Description ${payload}`,
          config: {
            sections: [{
              type: 'text',
              content: `Content ${payload}`
            }]
          }
        });

      expect(response.status).toBe(201);
      
      // Vérifier que le payload n'est pas présent dans la réponse
      const dom = new JSDOM(response.text);
      const scripts = dom.window.document.querySelectorAll('script');
      expect(scripts.length).toBe(0);

      // Vérifier que les attributs dangereux sont supprimés
      const elements = dom.window.document.querySelectorAll('*');
      elements.forEach(element => {
        expect(element.getAttribute('onerror')).toBeNull();
        expect(element.getAttribute('onload')).toBeNull();
        expect(element.getAttribute('href')).not.toContain('javascript:');
        expect(element.getAttribute('src')).not.toContain('javascript:');
      });
    });

    it('preserves safe HTML', async () => {
      const safeHtml = `
        <div class="report">
          <h1>Report Title</h1>
          <p><strong>Important</strong> information</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <table>
            <tr><td>Data</td></tr>
          </table>
        </div>
      `;

      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Safe Template',
          config: {
            sections: [{
              type: 'text',
              content: safeHtml
            }]
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.config.sections[0].content).toContain('<div class="report">');
      expect(response.body.config.sections[0].content).toContain('<h1>');
      expect(response.body.config.sections[0].content).toContain('<strong>');
    });
  });

  describe('Content Security Policy', () => {
    it('sets appropriate CSP headers', async () => {
      const response = await request(app)
        .get('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['content-security-policy']).toContain("script-src 'self'");
    });

    it('reports CSP violations', async () => {
      const violation = {
        'csp-report': {
          'document-uri': 'http://example.com',
          'violated-directive': 'script-src',
          'blocked-uri': 'http://malicious.com/script.js'
        }
      };

      const response = await request(app)
        .post('/api/csp-report')
        .send(violation);

      expect(response.status).toBe(204);

      // Vérifier que la violation a été enregistrée
      const logs = await db.query(
        'SELECT * FROM security_logs WHERE event_type = $1 ORDER BY created_at DESC LIMIT 1',
        ['csp_violation']
      );

      expect(logs.rows[0].details).toMatchObject(violation['csp-report']);
    });
  });

  describe('DOM Purification', () => {
    it('removes dangerous DOM elements', async () => {
      const dangerousContent = `
        <div>
          <script>alert('xss')</script>
          <base href="http://malicious.com">
          <object data="dangerous.swf"></object>
          <embed src="dangerous.swf">
          <form action="http://malicious.com">
            <input type="text">
          </form>
        </div>
      `;

      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Template',
          config: {
            sections: [{
              type: 'text',
              content: dangerousContent
            }]
          }
        });

      expect(response.status).toBe(201);
      
      const content = response.body.config.sections[0].content;
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('<base');
      expect(content).not.toContain('<object');
      expect(content).not.toContain('<embed');
      expect(content).not.toContain('<form');
    });

    it('sanitizes CSS', async () => {
      const dangerousCss = `
        <div style="background-image: url('javascript:alert(1)'); position: fixed; top: 0; left: 0;">
          <p style="behavior: url(malicious.htc)">Text</p>
          <div style="-moz-binding: url(malicious.xml)">Content</div>
        </div>
      `;

      const response = await request(app)
        .post('/api/report-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Template',
          config: {
            sections: [{
              type: 'text',
              content: dangerousCss
            }]
          }
        });

      expect(response.status).toBe(201);
      
      const content = response.body.config.sections[0].content;
      expect(content).not.toContain('javascript:');
      expect(content).not.toContain('behavior:');
      expect(content).not.toContain('-moz-binding:');
    });
  });

  describe('URL Validation', () => {
    it('validates URLs in content', async () => {
      const urls = [
        'javascript:alert("xss")',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=',
        'vbscript:alert("xss")',
        'file:///etc/passwd',
        'http://malicious.com/script.js'
      ];

      for (const url of urls) {
        const response = await request(app)
          .post('/api/report-templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Template',
            config: {
              sections: [{
                type: 'text',
                content: `<a href="${url}">Click me</a>`
              }]
            }
          });

        expect(response.status).toBe(201);
        expect(response.body.config.sections[0].content).not.toContain(url);
      }
    });

    it('allows safe URLs', async () => {
      const safeUrls = [
        'https://example.com',
        '/api/reports',
        'https://cdn.example.com/script.js',
        '//example.com/style.css'
      ];

      for (const url of safeUrls) {
        const response = await request(app)
          .post('/api/report-templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Template',
            config: {
              sections: [{
                type: 'text',
                content: `<a href="${url}">Click me</a>`
              }]
            }
          });

        expect(response.status).toBe(201);
        expect(response.body.config.sections[0].content).toContain(url);
      }
    });
  });
});
