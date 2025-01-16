const ExcelJS = require('exceljs');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');

class ExportService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    async generateWorkReport(filters) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Œuvres');

            // Configuration des colonnes
            worksheet.columns = [
                { header: 'ID', key: 'token_id', width: 10 },
                { header: 'Titre', key: 'title', width: 30 },
                { header: 'Créateur', key: 'creator_name', width: 20 },
                { header: 'Catégorie', key: 'category', width: 15 },
                { header: 'Royalties totales', key: 'total_royalties', width: 15 },
                { header: 'Date de création', key: 'created_at', width: 20 }
            ];

            // Construction de la requête avec filtres
            let query = `
                SELECT w.*, u.name as creator_name,
                       (SELECT SUM(amount) FROM royalty_distributions rd WHERE rd.token_id = w.token_id) as total_royalties
                FROM works w
                JOIN users u ON w.creator_id = u.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (filters.category) {
                query += ` AND w.category = $${paramIndex}`;
                params.push(filters.category);
                paramIndex++;
            }

            if (filters.startDate) {
                query += ` AND w.created_at >= $${paramIndex}`;
                params.push(filters.startDate);
                paramIndex++;
            }

            if (filters.endDate) {
                query += ` AND w.created_at <= $${paramIndex}`;
                params.push(filters.endDate);
                paramIndex++;
            }

            if (filters.minRoyalties) {
                query += ` AND (SELECT SUM(amount) FROM royalty_distributions rd WHERE rd.token_id = w.token_id) >= $${paramIndex}`;
                params.push(filters.minRoyalties);
                paramIndex++;
            }

            query += ' ORDER BY w.created_at DESC';

            // Récupération des données
            const { rows } = await this.pool.query(query, params);

            // Ajout des données au worksheet
            rows.forEach(row => {
                worksheet.addRow({
                    ...row,
                    created_at: new Date(row.created_at).toLocaleDateString(),
                    total_royalties: row.total_royalties || 0
                });
            });

            // Formatage des cellules
            worksheet.getRow(1).font = { bold: true };
            worksheet.getColumn('total_royalties').numFmt = '#,##0.00 "MATIC"';

            // Création du buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            logger.error('Erreur lors de la génération du rapport des œuvres:', error);
            throw error;
        }
    }

    async generateRoyaltyReport(filters) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Distributions de royalties');

            // Configuration des colonnes
            worksheet.columns = [
                { header: 'Date', key: 'created_at', width: 20 },
                { header: 'Œuvre', key: 'work_title', width: 30 },
                { header: 'Créateur', key: 'creator_name', width: 20 },
                { header: 'Destinataire', key: 'recipient_address', width: 45 },
                { header: 'Montant', key: 'amount', width: 15 },
                { header: 'Transaction', key: 'transaction_hash', width: 70 }
            ];

            // Construction de la requête avec filtres
            let query = `
                SELECT rd.*, w.title as work_title, u.name as creator_name
                FROM royalty_distributions rd
                JOIN works w ON rd.token_id = w.token_id
                JOIN users u ON w.creator_id = u.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (filters.startDate) {
                query += ` AND rd.created_at >= $${paramIndex}`;
                params.push(filters.startDate);
                paramIndex++;
            }

            if (filters.endDate) {
                query += ` AND rd.created_at <= $${paramIndex}`;
                params.push(filters.endDate);
                paramIndex++;
            }

            if (filters.minAmount) {
                query += ` AND rd.amount >= $${paramIndex}`;
                params.push(filters.minAmount);
                paramIndex++;
            }

            query += ' ORDER BY rd.created_at DESC';

            // Récupération des données
            const { rows } = await this.pool.query(query, params);

            // Ajout des données au worksheet
            rows.forEach(row => {
                worksheet.addRow({
                    ...row,
                    created_at: new Date(row.created_at).toLocaleDateString(),
                    amount: row.amount
                });
            });

            // Formatage des cellules
            worksheet.getRow(1).font = { bold: true };
            worksheet.getColumn('amount').numFmt = '#,##0.00 "MATIC"';

            // Création du buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            logger.error('Erreur lors de la génération du rapport des royalties:', error);
            throw error;
        }
    }

    async generateAnalyticsReport(period = '30d') {
        try {
            const workbook = new ExcelJS.Workbook();

            // Feuille des statistiques générales
            const statsSheet = workbook.addWorksheet('Statistiques générales');
            statsSheet.columns = [
                { header: 'Métrique', key: 'metric', width: 30 },
                { header: 'Valeur', key: 'value', width: 20 }
            ];

            // Récupération des statistiques
            const stats = await Promise.all([
                this.pool.query('SELECT COUNT(*) FROM works'),
                this.pool.query('SELECT COUNT(*) FROM users'),
                this.pool.query('SELECT SUM(amount) FROM royalty_distributions'),
                this.pool.query(`
                    SELECT COUNT(DISTINCT user_id)
                    FROM notifications
                    WHERE created_at >= NOW() - INTERVAL '${period}'
                `)
            ]);

            statsSheet.addRows([
                { metric: 'Nombre total d\'œuvres', value: stats[0].rows[0].count },
                { metric: 'Nombre total d\'utilisateurs', value: stats[1].rows[0].count },
                { metric: 'Volume total des royalties', value: stats[2].rows[0].sum || 0 },
                { metric: 'Utilisateurs actifs', value: stats[3].rows[0].count }
            ]);

            // Feuille des tendances
            const trendsSheet = workbook.addWorksheet('Tendances');
            trendsSheet.columns = [
                { header: 'Date', key: 'date', width: 20 },
                { header: 'Nouvelles œuvres', key: 'new_works', width: 20 },
                { header: 'Royalties distribuées', key: 'royalties', width: 20 }
            ];

            // Récupération des tendances
            const trends = await this.pool.query(`
                WITH daily_stats AS (
                    SELECT 
                        DATE_TRUNC('day', w.created_at) as date,
                        COUNT(DISTINCT w.id) as new_works,
                        COALESCE(SUM(rd.amount), 0) as royalties
                    FROM works w
                    LEFT JOIN royalty_distributions rd ON DATE_TRUNC('day', w.created_at) = DATE_TRUNC('day', rd.created_at)
                    WHERE w.created_at >= NOW() - INTERVAL '${period}'
                    GROUP BY DATE_TRUNC('day', w.created_at)
                    ORDER BY date
                )
                SELECT * FROM daily_stats
            `);

            trends.rows.forEach(row => {
                trendsSheet.addRow({
                    date: new Date(row.date).toLocaleDateString(),
                    new_works: row.new_works,
                    royalties: row.royalties
                });
            });

            // Formatage
            statsSheet.getRow(1).font = { bold: true };
            trendsSheet.getRow(1).font = { bold: true };
            statsSheet.getColumn('value').numFmt = '#,##0.00';
            trendsSheet.getColumn('royalties').numFmt = '#,##0.00 "MATIC"';

            // Création du buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            logger.error('Erreur lors de la génération du rapport d\'analyse:', error);
            throw error;
        }
    }
}

module.exports = new ExportService();
