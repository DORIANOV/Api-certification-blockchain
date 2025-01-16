const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../../src/db');
const config = require('../../src/config');

/**
 * Crée un utilisateur de test dans la base de données
 */
async function createTestUser({ email, password, role = 'user' }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, hashedPassword, role]
  );
  return result.rows[0];
}

/**
 * Crée un token JWT pour un utilisateur
 */
function createAuthToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

/**
 * Nettoie les données de test
 */
async function cleanupTestData() {
  await db.query('DELETE FROM scheduled_reports');
  await db.query('DELETE FROM report_templates');
  await db.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
}

/**
 * Crée des données de test pour les œuvres
 */
async function createTestWorks(userId, count = 5) {
  const works = [];
  for (let i = 0; i < count; i++) {
    const result = await db.query(
      `INSERT INTO works (
        title,
        description,
        category,
        created_by,
        status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        `Test Work ${i + 1}`,
        `Description for test work ${i + 1}`,
        ['image', 'video', 'audio', 'document'][i % 4],
        userId,
        'active'
      ]
    );
    works.push(result.rows[0]);
  }
  return works;
}

/**
 * Crée des données de test pour les royalties
 */
async function createTestRoyalties(works, amount = 100) {
  const royalties = [];
  for (const work of works) {
    const result = await db.query(
      `INSERT INTO royalties (
        work_id,
        amount,
        distributed_at,
        recipient_id
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        work.id,
        amount,
        new Date(),
        work.created_by
      ]
    );
    royalties.push(result.rows[0]);
  }
  return royalties;
}

/**
 * Crée un modèle de rapport de test
 */
async function createTestTemplate(userId, type = 'works') {
  const result = await db.query(
    `INSERT INTO report_templates (
      name,
      description,
      type,
      config,
      created_by
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      'Test Template',
      'Template for testing',
      type,
      {
        sections: [
          {
            type: 'summary',
            metrics: ['total_works', 'new_works']
          }
        ],
        filters: {
          period: '1M'
        }
      },
      userId
    ]
  );
  return result.rows[0];
}

/**
 * Crée un rapport programmé de test
 */
async function createTestSchedule(userId, templateId) {
  const result = await db.query(
    `INSERT INTO scheduled_reports (
      name,
      template_id,
      cron,
      recipients,
      enabled,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      'Test Schedule',
      templateId,
      '0 9 * * *',
      ['test@example.com'],
      true,
      userId
    ]
  );
  return result.rows[0];
}

module.exports = {
  createTestUser,
  createAuthToken,
  cleanupTestData,
  createTestWorks,
  createTestRoyalties,
  createTestTemplate,
  createTestSchedule
};
