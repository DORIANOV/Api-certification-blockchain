const APIKeyService = require('../services/api-keys');

/**
 * Middleware d'authentification API
 */
async function apiAuth(req, res, next) {
  try {
    // Extraire la clé API du header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'missing_api_key',
          message: 'API key is required'
        }
      });
    }

    const apiKey = authHeader.split(' ')[1];

    // Vérifier la clé API
    const keyData = await APIKeyService.verifyKey(apiKey);
    if (!keyData) {
      return res.status(401).json({
        error: {
          code: 'invalid_api_key',
          message: 'Invalid API key'
        }
      });
    }

    // Vérifier le statut du client
    if (keyData.status !== 'active') {
      return res.status(403).json({
        error: {
          code: 'account_inactive',
          message: 'Your account is not active'
        }
      });
    }

    // Vérifier le rate limit
    const withinLimit = await APIKeyService.checkRateLimit(apiKey);
    if (!withinLimit) {
      return res.status(429).json({
        error: {
          code: 'rate_limit_exceeded',
          message: 'Rate limit exceeded'
        }
      });
    }

    // Ajouter les informations du client à la requête
    req.client = {
      id: keyData.client_id,
      plan: keyData.plan,
      permissions: keyData.permissions
    };

    // Mettre à jour les stats d'utilisation
    await APIKeyService.updateUsageStats(apiKey);

    next();
  } catch (error) {
    console.error('API Auth Error:', error);
    res.status(500).json({
      error: {
        code: 'internal_error',
        message: 'An internal error occurred'
      }
    });
  }
}

module.exports = apiAuth;
