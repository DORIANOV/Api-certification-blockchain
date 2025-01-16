require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const { logger, httpLogger, errorLogger } = require('./utils/logger');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
const cache = require('./utils/cache');

const authRoutes = require('./routes/auth');
const worksRoutes = require('./routes/works');
const royaltiesRoutes = require('./routes/royalties');

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Documentation API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Métriques Prometheus
if (process.env.METRICS_ENABLED === 'true') {
    app.use(metricsMiddleware);
    app.get('/metrics', metricsEndpoint);
}

// Logging des requêtes HTTP
app.use(httpLogger);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Trop de requêtes, veuillez réessayer plus tard'
        });
    }
});
app.use(limiter);

// Vérification de la santé de l'application
app.get('/health', async (req, res) => {
    try {
        // Vérifier Redis
        await cache.client.ping();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                redis: 'up',
                api: 'up'
            }
        });
    } catch (error) {
        logger.error('Erreur de santé:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                redis: error.message.includes('Redis') ? 'down' : 'up',
                api: 'up'
            }
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/royalties', royaltiesRoutes);

// Page d'accueil
app.get('/', (req, res) => {
    res.json({
        name: 'API de Gestion des Droits d\'Auteur sur Blockchain',
        version: '1.0.0',
        documentation: '/api-docs',
        metrics: '/metrics',
        health: '/health'
    });
});

// Gestion des erreurs
app.use(errorLogger);
app.use((err, req, res, next) => {
    logger.error(`Erreur non gérée: ${err.message}`);
    res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue sur le serveur'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Serveur démarré sur le port ${PORT}`);
});
