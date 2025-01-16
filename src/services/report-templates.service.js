const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { cache } = require('../utils/cache');
const { format } = require('date-fns');

class ReportTemplatesService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    async getTemplates(filters = {}) {
        try {
            let query = 'SELECT * FROM report_templates WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (filters.type) {
                query += ` AND type = $${paramIndex}`;
                params.push(filters.type);
                paramIndex++;
            }

            if (typeof filters.is_system === 'boolean') {
                query += ` AND is_system = $${paramIndex}`;
                params.push(filters.is_system);
                paramIndex++;
            }

            query += ' ORDER BY is_system DESC, name ASC';

            const { rows } = await this.pool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Erreur lors de la récupération des modèles:', error);
            throw error;
        }
    }

    async createTemplate(templateData) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `INSERT INTO report_templates 
                (name, description, type, config, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [
                    templateData.name,
                    templateData.description,
                    templateData.type,
                    templateData.config,
                    templateData.created_by
                ]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erreur lors de la création du modèle:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async updateTemplate(id, templateData) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Vérifier si c'est un modèle système
            const { rows: [template] } = await client.query(
                'SELECT is_system FROM report_templates WHERE id = $1',
                [id]
            );

            if (template?.is_system) {
                throw new Error('Les modèles système ne peuvent pas être modifiés');
            }

            const { rows } = await client.query(
                `UPDATE report_templates 
                SET name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    type = COALESCE($3, type),
                    config = COALESCE($4, config)
                WHERE id = $5 AND NOT is_system
                RETURNING *`,
                [
                    templateData.name,
                    templateData.description,
                    templateData.type,
                    templateData.config,
                    id
                ]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erreur lors de la mise à jour du modèle:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteTemplate(id) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Vérifier si c'est un modèle système
            const { rows: [template] } = await client.query(
                'SELECT is_system FROM report_templates WHERE id = $1',
                [id]
            );

            if (template?.is_system) {
                throw new Error('Les modèles système ne peuvent pas être supprimés');
            }

            await client.query(
                'DELETE FROM report_templates WHERE id = $1 AND NOT is_system',
                [id]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erreur lors de la suppression du modèle:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async previewTemplate(templateId, filters = {}) {
        try {
            // Récupérer le modèle
            const { rows: [template] } = await this.pool.query(
                'SELECT * FROM report_templates WHERE id = $1',
                [templateId]
            );

            if (!template) {
                throw new Error('Modèle non trouvé');
            }

            // Fusionner les filtres du modèle avec les filtres fournis
            const mergedFilters = {
                ...template.config.filters,
                ...filters
            };

            // Générer les données pour chaque section
            const sections = await Promise.all(
                template.config.sections.map(async (section) => {
                    const data = await this.generateSectionData(section, mergedFilters);
                    return {
                        ...section,
                        data
                    };
                })
            );

            return {
                name: template.name,
                description: template.description,
                type: template.type,
                sections
            };
        } catch (error) {
            logger.error('Erreur lors de la prévisualisation du modèle:', error);
            throw error;
        }
    }

    async generateSectionData(section, filters) {
        const cacheKey = `report:${section.type}:${JSON.stringify({ section, filters })}`;
        const cachedData = await cache.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        try {
            let data;
            switch (section.type) {
                case 'summary':
                    data = await this.generateSummaryData(section.metrics, filters);
                    break;
                case 'chart':
                    data = await this.generateChartData(section.data.query, filters);
                    break;
                case 'table':
                    data = await this.generateTableData(section, filters);
                    break;
                default:
                    throw new Error(`Type de section non supporté: ${section.type}`);
            }

            // Mettre en cache pour 5 minutes
            await cache.set(cacheKey, data, 300);
            return data;
        } catch (error) {
            logger.error('Erreur lors de la génération des données de section:', error);
            throw error;
        }
    }

    async generateSummaryData(metrics, filters) {
        const period = filters.period || '30d';
        const data = {};

        for (const metric of metrics) {
            switch (metric) {
                case 'total_works':
                    const { rows: [totalWorks] } = await this.pool.query(
                        'SELECT COUNT(*) as value FROM works'
                    );
                    data[metric] = parseInt(totalWorks.value);
                    break;

                case 'new_works':
                    const { rows: [newWorks] } = await this.pool.query(
                        `SELECT COUNT(*) as value 
                        FROM works 
                        WHERE created_at >= NOW() - INTERVAL '${period}'`
                    );
                    data[metric] = parseInt(newWorks.value);
                    break;

                case 'total_royalties':
                    const { rows: [totalRoyalties] } = await this.pool.query(
                        'SELECT SUM(amount) as value FROM royalty_distributions'
                    );
                    data[metric] = parseFloat(totalRoyalties.value || 0);
                    break;

                // Ajouter d'autres métriques selon les besoins
            }
        }

        return data;
    }

    async generateChartData(query, filters) {
        const period = filters.period || '30d';

        switch (query) {
            case 'category_distribution':
                const { rows: categories } = await this.pool.query(`
                    SELECT category, COUNT(*) as count
                    FROM works
                    GROUP BY category
                    ORDER BY count DESC
                `);
                return categories;

            case 'royalties_trend':
                const { rows: trend } = await this.pool.query(`
                    SELECT 
                        DATE_TRUNC('day', created_at) as date,
                        SUM(amount) as amount
                    FROM royalty_distributions
                    WHERE created_at >= NOW() - INTERVAL '${period}'
                    GROUP BY DATE_TRUNC('day', created_at)
                    ORDER BY date
                `);
                return trend.map(row => ({
                    ...row,
                    date: format(row.date, 'yyyy-MM-dd')
                }));

            // Ajouter d'autres requêtes selon les besoins
        }
    }

    async generateTableData(section, filters) {
        const { columns, sort, limit } = section;
        const period = filters.period || '30d';

        let query = '';
        switch (section.title) {
            case 'Top 10 des œuvres':
                query = `
                    SELECT 
                        w.title,
                        u.name as creator,
                        COALESCE(SUM(rd.amount), 0) as royalties,
                        w.created_at
                    FROM works w
                    LEFT JOIN users u ON w.creator_id = u.id
                    LEFT JOIN royalty_distributions rd ON w.token_id = rd.token_id
                    WHERE w.created_at >= NOW() - INTERVAL '${period}'
                    GROUP BY w.id, w.title, u.name, w.created_at
                    ORDER BY royalties DESC
                    LIMIT ${limit}
                `;
                break;

            // Ajouter d'autres cas selon les besoins
        }

        if (query) {
            const { rows } = await this.pool.query(query);
            return rows;
        }

        return [];
    }
}

module.exports = new ReportTemplatesService();
