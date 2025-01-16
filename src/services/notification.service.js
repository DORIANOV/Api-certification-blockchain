const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const { Pool } = require('pg');
const WebSocket = require('ws');

class NotificationService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        // Configuration du transporteur d'emails
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Initialisation du serveur WebSocket
        this.wss = new WebSocket.Server({ 
            noServer: true,
            path: '/notifications'
        });

        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const userId = req.session.userId; // Récupérer l'ID de l'utilisateur depuis la session
            
            ws.userId = userId;
            logger.info(`Nouvelle connexion WebSocket pour l'utilisateur ${userId}`);

            ws.on('close', () => {
                logger.info(`Connexion WebSocket fermée pour l'utilisateur ${userId}`);
            });
        });
    }

    async notifyRoyaltyDistribution(distribution) {
        try {
            const { tokenId, recipient, amount, transactionHash } = distribution;

            // Récupérer les détails de l'œuvre et du créateur
            const workDetails = await this.pool.query(
                'SELECT w.title, u.email, u.name FROM works w JOIN users u ON w.creator_id = u.id WHERE w.token_id = $1',
                [tokenId]
            );

            if (workDetails.rows.length === 0) {
                throw new Error('Œuvre non trouvée');
            }

            const { title, email, name } = workDetails.rows[0];

            // Envoyer l'email
            await this.sendEmail({
                to: email,
                subject: 'Distribution de royalties',
                html: `
                    <h2>Distribution de royalties pour "${title}"</h2>
                    <p>Bonjour ${name},</p>
                    <p>Une distribution de royalties a été effectuée pour votre œuvre "${title}".</p>
                    <p>Détails de la transaction :</p>
                    <ul>
                        <li>Montant : ${amount} MATIC</li>
                        <li>Destinataire : ${recipient}</li>
                        <li>Transaction : ${transactionHash}</li>
                    </ul>
                    <p>Vous pouvez consulter la transaction sur <a href="https://polygonscan.com/tx/${transactionHash}">Polygonscan</a>.</p>
                `
            });

            // Envoyer la notification WebSocket
            this.broadcastNotification({
                type: 'ROYALTY_DISTRIBUTION',
                data: {
                    tokenId,
                    title,
                    recipient,
                    amount,
                    transactionHash,
                    timestamp: new Date().toISOString()
                }
            });

            // Sauvegarder la notification dans la base de données
            await this.saveNotification({
                userId: workDetails.rows[0].creator_id,
                type: 'ROYALTY_DISTRIBUTION',
                data: distribution,
                read: false
            });

        } catch (error) {
            logger.error('Erreur lors de l\'envoi de la notification:', error);
            throw error;
        }
    }

    async sendEmail({ to, subject, html }) {
        try {
            const info = await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject,
                html
            });

            logger.info('Email envoyé:', info.messageId);
            return info;
        } catch (error) {
            logger.error('Erreur lors de l\'envoi de l\'email:', error);
            throw error;
        }
    }

    broadcastNotification(notification) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(notification));
            }
        });
    }

    async saveNotification(notification) {
        try {
            const { userId, type, data, read } = notification;
            
            await this.pool.query(
                'INSERT INTO notifications (user_id, type, data, read) VALUES ($1, $2, $3, $4)',
                [userId, type, JSON.stringify(data), read]
            );
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde de la notification:', error);
            throw error;
        }
    }

    async getUnreadNotifications(userId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY created_at DESC',
                [userId]
            );
            return result.rows;
        } catch (error) {
            logger.error('Erreur lors de la récupération des notifications:', error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId, userId) {
        try {
            await this.pool.query(
                'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
                [notificationId, userId]
            );
        } catch (error) {
            logger.error('Erreur lors du marquage de la notification comme lue:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
