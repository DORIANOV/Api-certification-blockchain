const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationService = require('../services/notification.service');
const { logger } = require('../utils/logger');
const { metrics } = require('../middleware/metrics');

// Récupérer les notifications non lues
router.get('/unread', auth, async (req, res) => {
    try {
        const notifications = await notificationService.getUnreadNotifications(req.user.id);
        
        // Incrémenter le compteur de métriques
        metrics.httpRequestsTotal.inc({
            method: 'GET',
            path: '/api/notifications/unread',
            status: 200
        });

        res.json({
            status: 'success',
            data: {
                notifications
            }
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des notifications'
        });
    }
});

// Marquer une notification comme lue
router.post('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markNotificationAsRead(id, req.user.id);
        
        // Incrémenter le compteur de métriques
        metrics.httpRequestsTotal.inc({
            method: 'POST',
            path: '/api/notifications/:id/read',
            status: 200
        });

        res.json({
            status: 'success',
            message: 'Notification marquée comme lue'
        });
    } catch (error) {
        logger.error('Erreur lors du marquage de la notification:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors du marquage de la notification'
        });
    }
});

// Marquer toutes les notifications comme lues
router.post('/read-all', auth, async (req, res) => {
    try {
        const notifications = await notificationService.getUnreadNotifications(req.user.id);
        
        for (const notification of notifications) {
            await notificationService.markNotificationAsRead(notification.id, req.user.id);
        }
        
        // Incrémenter le compteur de métriques
        metrics.httpRequestsTotal.inc({
            method: 'POST',
            path: '/api/notifications/read-all',
            status: 200
        });

        res.json({
            status: 'success',
            message: 'Toutes les notifications ont été marquées comme lues'
        });
    } catch (error) {
        logger.error('Erreur lors du marquage des notifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors du marquage des notifications'
        });
    }
});

module.exports = router;
