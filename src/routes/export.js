const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const exportService = require('../services/export.service');
const { logger } = require('../utils/logger');
const { metrics } = require('../middleware/metrics');

// Middleware pour suivre les exports
const trackExport = (type) => (req, res, next) => {
    metrics.exportsTotal.inc({ type });
    next();
};

// Export des œuvres
router.get('/works', auth, isAdmin, trackExport('works'), async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            minRoyalties: req.query.minRoyalties ? parseFloat(req.query.minRoyalties) : null
        };

        const buffer = await exportService.generateWorkReport(filters);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=works_report.xlsx');
        res.send(buffer);

        logger.info('Rapport des œuvres exporté avec succès');
    } catch (error) {
        logger.error('Erreur lors de l\'export des œuvres:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du rapport'
        });
    }
});

// Export des royalties
router.get('/royalties', auth, isAdmin, trackExport('royalties'), async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : null
        };

        const buffer = await exportService.generateRoyaltyReport(filters);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=royalties_report.xlsx');
        res.send(buffer);

        logger.info('Rapport des royalties exporté avec succès');
    } catch (error) {
        logger.error('Erreur lors de l\'export des royalties:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du rapport'
        });
    }
});

// Export des analyses
router.get('/analytics', auth, isAdmin, trackExport('analytics'), async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const buffer = await exportService.generateAnalyticsReport(period);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics_report.xlsx');
        res.send(buffer);

        logger.info('Rapport d\'analyse exporté avec succès');
    } catch (error) {
        logger.error('Erreur lors de l\'export des analyses:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du rapport'
        });
    }
});

module.exports = router;
