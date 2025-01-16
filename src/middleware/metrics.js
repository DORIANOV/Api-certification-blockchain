const promClient = require('prom-client');
const { logger } = require('../utils/logger');

// Création du registre Prometheus
const register = new promClient.Registry();

// Ajout des métriques par défaut
promClient.collectDefaultMetrics({ register });

// Compteur pour les requêtes HTTP
const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total des requêtes HTTP',
    labelNames: ['method', 'path', 'status']
});

// Histogramme pour la durée des requêtes
const httpRequestDurationMs = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Durée des requêtes HTTP en millisecondes',
    labelNames: ['method', 'path', 'status'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

// Compteur pour les transactions blockchain
const blockchainTransactionsTotal = new promClient.Counter({
    name: 'blockchain_transactions_total',
    help: 'Total des transactions blockchain',
    labelNames: ['type', 'status']
});

// Gauge pour le nombre d'utilisateurs connectés
const connectedUsers = new promClient.Gauge({
    name: 'connected_users_total',
    help: 'Nombre total d\'utilisateurs connectés'
});

// Enregistrement des métriques
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationMs);
register.registerMetric(blockchainTransactionsTotal);
register.registerMetric(connectedUsers);

// Middleware pour collecter les métriques des requêtes
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    // Intercepter la fin de la requête
    res.on('finish', () => {
        const duration = Date.now() - start;
        const path = req.route ? req.route.path : req.path;
        const labels = {
            method: req.method,
            path,
            status: res.statusCode
        };

        // Incrémenter le compteur de requêtes
        httpRequestsTotal.inc(labels);

        // Enregistrer la durée de la requête
        httpRequestDurationMs.observe(labels, duration);

        // Logger les métriques si la durée dépasse un seuil
        if (duration > 1000) {
            logger.warn(`Requête lente détectée: ${req.method} ${path} (${duration}ms)`);
        }
    });

    next();
};

// Endpoint pour exposer les métriques
const metricsEndpoint = async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        logger.error('Erreur lors de la génération des métriques:', error);
        res.status(500).end();
    }
};

module.exports = {
    metricsMiddleware,
    metricsEndpoint,
    metrics: {
        httpRequestsTotal,
        httpRequestDurationMs,
        blockchainTransactionsTotal,
        connectedUsers
    }
};
