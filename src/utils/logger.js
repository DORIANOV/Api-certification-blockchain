const winston = require('winston');
const path = require('path');

// Configuration des niveaux de log personnalisés
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Configuration des couleurs pour chaque niveau
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

// Ajout des couleurs à Winston
winston.addColors(colors);

// Format personnalisé
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Configuration des transports (destinations des logs)
const transports = [
    // Logs console
    new winston.transports.Console(),
    
    // Logs d'erreur dans un fichier
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error'
    }),
    
    // Tous les logs dans un fichier
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log')
    })
];

// Création du logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports
});

// Middleware pour logger les requêtes HTTP
const httpLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(
            `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
        );
    });
    next();
};

// Middleware pour capturer et logger les erreurs
const errorLogger = (err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);
    next(err);
};

module.exports = {
    logger,
    httpLogger,
    errorLogger
};
