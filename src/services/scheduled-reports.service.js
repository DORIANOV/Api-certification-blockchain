const { Pool } = require('pg');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const exportService = require('./export.service');
const { parseExpression } = require('cron-parser');

class ScheduledReportsService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        this.mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Démarrer le planificateur
        this.startScheduler();
    }

    async createScheduledReport(reportData) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Valider et parser l'expression cron
            const interval = parseExpression(reportData.schedule);
            const nextRun = interval.next().toDate();

            const { rows } = await client.query(
                `INSERT INTO scheduled_reports 
                (name, description, type, schedule, filters, recipients, created_by, next_run_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    reportData.name,
                    reportData.description,
                    reportData.type,
                    reportData.schedule,
                    reportData.filters,
                    reportData.recipients,
                    reportData.created_by,
                    nextRun
                ]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erreur lors de la création du rapport programmé:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async updateScheduledReport(id, reportData) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Valider et parser l'expression cron si modifiée
            let nextRun = null;
            if (reportData.schedule) {
                const interval = parseExpression(reportData.schedule);
                nextRun = interval.next().toDate();
            }

            const { rows } = await client.query(
                `UPDATE scheduled_reports 
                SET name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    type = COALESCE($3, type),
                    schedule = COALESCE($4, schedule),
                    filters = COALESCE($5, filters),
                    recipients = COALESCE($6, recipients),
                    next_run_at = COALESCE($7, next_run_at),
                    is_active = COALESCE($8, is_active)
                WHERE id = $9
                RETURNING *`,
                [
                    reportData.name,
                    reportData.description,
                    reportData.type,
                    reportData.schedule,
                    reportData.filters,
                    reportData.recipients,
                    nextRun,
                    reportData.is_active,
                    id
                ]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erreur lors de la mise à jour du rapport programmé:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteScheduledReport(id) {
        try {
            await this.pool.query(
                'DELETE FROM scheduled_reports WHERE id = $1',
                [id]
            );
            return true;
        } catch (error) {
            logger.error('Erreur lors de la suppression du rapport programmé:', error);
            throw error;
        }
    }

    async getScheduledReports(filters = {}) {
        try {
            let query = 'SELECT * FROM scheduled_reports WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (filters.type) {
                query += ` AND type = $${paramIndex}`;
                params.push(filters.type);
                paramIndex++;
            }

            if (typeof filters.is_active === 'boolean') {
                query += ` AND is_active = $${paramIndex}`;
                params.push(filters.is_active);
                paramIndex++;
            }

            query += ' ORDER BY created_at DESC';

            const { rows } = await this.pool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Erreur lors de la récupération des rapports programmés:', error);
            throw error;
        }
    }

    async executeReport(report) {
        try {
            let buffer;
            switch (report.type) {
                case 'works':
                    buffer = await exportService.generateWorkReport(report.filters);
                    break;
                case 'royalties':
                    buffer = await exportService.generateRoyaltyReport(report.filters);
                    break;
                case 'analytics':
                    buffer = await exportService.generateAnalyticsReport(report.filters.period);
                    break;
                default:
                    throw new Error(`Type de rapport non supporté: ${report.type}`);
            }

            // Envoyer le rapport par email
            const mailOptions = {
                from: process.env.SMTP_FROM,
                to: report.recipients.join(', '),
                subject: `Rapport automatique: ${report.name}`,
                text: `Veuillez trouver ci-joint le rapport "${report.name}" généré automatiquement.`,
                attachments: [{
                    filename: `${report.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
                    content: buffer
                }]
            };

            await this.mailer.sendMail(mailOptions);

            // Mettre à jour la date de dernière exécution
            const interval = parseExpression(report.schedule);
            const nextRun = interval.next().toDate();

            await this.pool.query(
                `UPDATE scheduled_reports 
                SET last_run_at = CURRENT_TIMESTAMP,
                    next_run_at = $1
                WHERE id = $2`,
                [nextRun, report.id]
            );

            logger.info(`Rapport programmé ${report.id} exécuté avec succès`);
        } catch (error) {
            logger.error(`Erreur lors de l'exécution du rapport programmé ${report.id}:`, error);
            throw error;
        }
    }

    async startScheduler() {
        // Vérifier les rapports toutes les minutes
        cron.schedule('* * * * *', async () => {
            try {
                const { rows: dueReports } = await this.pool.query(
                    `SELECT * FROM scheduled_reports 
                    WHERE is_active = true 
                    AND next_run_at <= CURRENT_TIMESTAMP`
                );

                for (const report of dueReports) {
                    try {
                        await this.executeReport(report);
                    } catch (error) {
                        logger.error(`Erreur lors de l'exécution du rapport ${report.id}:`, error);
                    }
                }
            } catch (error) {
                logger.error('Erreur dans le planificateur de rapports:', error);
            }
        });

        logger.info('Planificateur de rapports démarré');
    }
}

module.exports = new ScheduledReportsService();
