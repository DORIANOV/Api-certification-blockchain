const cache = require('../utils/cache');
const { logger } = require('../utils/logger');

const cacheMiddleware = (options = {}) => {
    const {
        expire = 3600,
        keyPrefix = '',
        condition = () => true
    } = options;

    return async (req, res, next) => {
        // Ne pas mettre en cache si la condition n'est pas remplie
        if (!condition(req)) {
            return next();
        }

        // Générer la clé de cache
        const cacheKey = cache.generateKey(
            keyPrefix,
            req.originalUrl,
            req.method,
            JSON.stringify(req.body)
        );

        try {
            // Vérifier le cache
            const cachedData = await cache.get(cacheKey);
            
            if (cachedData) {
                logger.debug(`Cache hit pour ${cacheKey}`);
                return res.json(cachedData);
            }

            // Intercepter la réponse pour la mettre en cache
            const originalJson = res.json;
            res.json = function(data) {
                // Restaurer la méthode json originale
                res.json = originalJson;

                // Ne mettre en cache que les réponses réussies
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.set(cacheKey, data, expire)
                        .catch(error => logger.error('Erreur lors de la mise en cache:', error));
                }

                // Envoyer la réponse
                return res.json(data);
            };

            next();
        } catch (error) {
            logger.error('Erreur dans le middleware de cache:', error);
            next();
        }
    };
};

// Middleware pour invalider le cache
const invalidateCache = (pattern) => {
    return async (req, res, next) => {
        try {
            const keys = await cache.client.keys(pattern);
            if (keys.length > 0) {
                await cache.client.del(keys);
                logger.debug(`Cache invalidé pour le pattern: ${pattern}`);
            }
        } catch (error) {
            logger.error('Erreur lors de l\'invalidation du cache:', error);
        }
        next();
    };
};

module.exports = {
    cacheMiddleware,
    invalidateCache
};
