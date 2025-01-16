const crypto = require('crypto');
const { db } = require('../db');
const { redis } = require('./cache');

class APIKeyService {
  /**
   * Génère une nouvelle clé API
   */
  static generateKey() {
    return `rpt_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Crée une nouvelle clé API pour un client
   */
  static async createKey(clientId, options = {}) {
    const apiKey = this.generateKey();
    const hashedKey = await this.hashKey(apiKey);

    await db.query(
      `INSERT INTO api_keys (
        client_id,
        key_hash,
        name,
        permissions,
        rate_limit,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        clientId,
        hashedKey,
        options.name || 'Default API Key',
        options.permissions || ['read', 'write'],
        options.rateLimit || 100,
        options.expiresAt || null
      ]
    );

    // La clé complète n'est retournée qu'une seule fois
    return apiKey;
  }

  /**
   * Vérifie une clé API
   */
  static async verifyKey(apiKey) {
    const hashedKey = await this.hashKey(apiKey);
    
    // Vérifier d'abord le cache Redis
    const cachedKey = await redis.get(`api_key:${hashedKey}`);
    if (cachedKey) {
      return JSON.parse(cachedKey);
    }

    // Si pas en cache, vérifier la base de données
    const result = await db.query(
      `SELECT 
        ak.*,
        c.plan,
        c.status
      FROM api_keys ak
      JOIN clients c ON c.id = ak.client_id
      WHERE ak.key_hash = $1 
      AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
      AND ak.is_active = true`,
      [hashedKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const keyData = result.rows[0];

    // Mettre en cache pour les prochaines requêtes
    await redis.set(
      `api_key:${hashedKey}`,
      JSON.stringify(keyData),
      'EX',
      300 // Cache pour 5 minutes
    );

    return keyData;
  }

  /**
   * Vérifie le rate limiting pour une clé API
   */
  static async checkRateLimit(apiKey) {
    const key = `rate_limit:${apiKey}`;
    const limit = await redis.get(key);

    if (!limit) {
      await redis.set(key, 1, 'EX', 3600);
      return true;
    }

    if (parseInt(limit) >= 100) { // Limite configurable selon le plan
      return false;
    }

    await redis.incr(key);
    return true;
  }

  /**
   * Révoque une clé API
   */
  static async revokeKey(apiKey) {
    const hashedKey = await this.hashKey(apiKey);
    
    await db.query(
      'UPDATE api_keys SET is_active = false WHERE key_hash = $1',
      [hashedKey]
    );

    // Supprimer du cache
    await redis.del(`api_key:${hashedKey}`);
  }

  /**
   * Hash une clé API pour le stockage
   */
  static async hashKey(apiKey) {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
  }

  /**
   * Liste les clés API d'un client
   */
  static async listKeys(clientId) {
    const result = await db.query(
      `SELECT 
        id,
        name,
        permissions,
        rate_limit,
        created_at,
        expires_at,
        last_used_at,
        is_active
      FROM api_keys
      WHERE client_id = $1
      ORDER BY created_at DESC`,
      [clientId]
    );

    return result.rows;
  }

  /**
   * Met à jour les statistiques d'utilisation
   */
  static async updateUsageStats(apiKey) {
    const hashedKey = await this.hashKey(apiKey);
    
    await db.query(
      `UPDATE api_keys 
      SET 
        last_used_at = NOW(),
        usage_count = usage_count + 1
      WHERE key_hash = $1`,
      [hashedKey]
    );
  }
}

module.exports = APIKeyService;
