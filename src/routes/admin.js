const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { metrics } = require('../middleware/metrics');
const cache = require('../utils/cache');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Middleware pour vérifier les droits d'administrateur
const isAdmin = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0 || !result.rows[0].is_admin) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès non autorisé'
            });
        }

        next();
    } catch (error) {
        logger.error('Erreur lors de la vérification des droits admin:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la vérification des droits'
        });
    }
};

// Statistiques générales
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const cacheKey = 'admin:stats';
        const cachedStats = await cache.get(cacheKey);

        if (cachedStats) {
            return res.json({
                status: 'success',
                data: cachedStats
            });
        }

        const stats = await Promise.all([
            // Nombre total d'utilisateurs
            pool.query('SELECT COUNT(*) FROM users'),
            // Nombre total d'œuvres
            pool.query('SELECT COUNT(*) FROM works'),
            // Nombre total de distributions de royalties
            pool.query('SELECT COUNT(*) FROM royalty_distributions'),
            // Volume total des royalties
            pool.query('SELECT SUM(amount) FROM royalty_distributions'),
            // Utilisateurs actifs ce mois
            pool.query(`
                SELECT COUNT(DISTINCT user_id) 
                FROM notifications 
                WHERE created_at >= NOW() - INTERVAL '30 days'
            `)
        ]);

        const data = {
            totalUsers: parseInt(stats[0].rows[0].count),
            totalWorks: parseInt(stats[1].rows[0].count),
            totalDistributions: parseInt(stats[2].rows[0].count),
            totalRoyalties: stats[3].rows[0].sum || 0,
            activeUsers: parseInt(stats[4].rows[0].count)
        };

        // Mettre en cache pour 5 minutes
        await cache.set(cacheKey, data, 300);

        res.json({
            status: 'success',
            data
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// Liste des utilisateurs avec pagination
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT id, email, name, company, created_at, is_admin
            FROM users
            WHERE email ILIKE $1 OR name ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const [users, total] = await Promise.all([
            pool.query(query, [`%${search}%`, limit, offset]),
            pool.query(
                'SELECT COUNT(*) FROM users WHERE email ILIKE $1 OR name ILIKE $1',
                [`%${search}%`]
            )
        ]);

        res.json({
            status: 'success',
            data: {
                users: users.rows,
                pagination: {
                    total: parseInt(total.rows[0].count),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total.rows[0].count / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des utilisateurs'
        });
    }
});

// Liste des œuvres avec pagination et recherche
router.get('/works', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT w.*, u.name as creator_name,
                   (SELECT SUM(amount) FROM royalty_distributions rd WHERE rd.token_id = w.token_id) as total_royalties
            FROM works w
            JOIN users u ON w.creator_id = u.id
            WHERE w.title ILIKE $1 OR u.name ILIKE $1
            ORDER BY w.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const [works, total] = await Promise.all([
            pool.query(query, [`%${search}%`, limit, offset]),
            pool.query(`
                SELECT COUNT(*)
                FROM works w
                JOIN users u ON w.creator_id = u.id
                WHERE w.title ILIKE $1 OR u.name ILIKE $1
            `, [`%${search}%`])
        ]);

        res.json({
            status: 'success',
            data: {
                works: works.rows,
                pagination: {
                    total: parseInt(total.rows[0].count),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total.rows[0].count / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des œuvres:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des œuvres'
        });
    }
});

// Statistiques des œuvres
router.get('/works/stats', auth, isAdmin, async (req, res) => {
    try {
        const cacheKey = 'admin:works:stats';
        const cachedStats = await cache.get(cacheKey);

        if (cachedStats) {
            return res.json({
                status: 'success',
                data: cachedStats
            });
        }

        const [royaltiesOverTime, categoriesDistribution] = await Promise.all([
            // Distribution des royalties dans le temps
            pool.query(`
                SELECT DATE_TRUNC('day', created_at) as date,
                       SUM(amount) as amount
                FROM royalty_distributions
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date
            `),
            // Distribution par catégorie
            pool.query(`
                SELECT category, COUNT(*) as count
                FROM works
                GROUP BY category
                ORDER BY count DESC
                LIMIT 5
            `)
        ]);

        const data = {
            royaltiesOverTime: royaltiesOverTime.rows,
            categoriesDistribution: categoriesDistribution.rows
        };

        // Mettre en cache pour 5 minutes
        await cache.set(cacheKey, data, 300);

        res.json({
            status: 'success',
            data
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des statistiques des œuvres:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// Détails des transactions de royalties
router.get('/transactions', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let dateFilter = '';
        const params = [limit, offset];

        if (startDate && endDate) {
            dateFilter = 'WHERE created_at BETWEEN $3 AND $4';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT rd.*, w.title as work_title, u.name as creator_name
            FROM royalty_distributions rd
            JOIN works w ON rd.token_id = w.token_id
            JOIN users u ON w.creator_id = u.id
            ${dateFilter}
            ORDER BY rd.created_at DESC
            LIMIT $1 OFFSET $2
        `;

        const [transactions, total] = await Promise.all([
            pool.query(query, params),
            pool.query(
                `SELECT COUNT(*) FROM royalty_distributions ${dateFilter}`,
                params.slice(2)
            )
        ]);

        res.json({
            status: 'success',
            data: {
                transactions: transactions.rows,
                pagination: {
                    total: parseInt(total.rows[0].count),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total.rows[0].count / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des transactions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des transactions'
        });
    }
});

// Gestion des droits administrateur
router.post('/users/:id/toggle-admin', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Empêcher l'auto-modification
        if (id === req.user.id) {
            return res.status(400).json({
                status: 'error',
                message: 'Vous ne pouvez pas modifier vos propres droits'
            });
        }

        await pool.query(
            'UPDATE users SET is_admin = NOT is_admin WHERE id = $1',
            [id]
        );

        res.json({
            status: 'success',
            message: 'Droits administrateur mis à jour'
        });
    } catch (error) {
        logger.error('Erreur lors de la modification des droits admin:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la modification des droits'
        });
    }
});

module.exports = router;
