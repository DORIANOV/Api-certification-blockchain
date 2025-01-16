const Redis = require('ioredis');
const { logger } = require('./logger');

class Cache {
    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('error', (error) => {
            logger.error('Erreur Redis:', error);
        });

        this.client.on('connect', () => {
            logger.info('Connecté à Redis');
        });
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Erreur lors de la récupération de la clé ${key}:`, error);
            return null;
        }
    }

    async set(key, value, expireSeconds = 3600) {
        try {
            await this.client.set(
                key,
                JSON.stringify(value),
                'EX',
                expireSeconds
            );
            return true;
        } catch (error) {
            logger.error(`Erreur lors de la définition de la clé ${key}:`, error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(`Erreur lors de la suppression de la clé ${key}:`, error);
            return false;
        }
    }

    async getOrSet(key, callback, expireSeconds = 3600) {
        try {
            const cachedValue = await this.get(key);
            if (cachedValue !== null) {
                return cachedValue;
            }

            const freshValue = await callback();
            await this.set(key, freshValue, expireSeconds);
            return freshValue;
        } catch (error) {
            logger.error(`Erreur lors de getOrSet pour la clé ${key}:`, error);
            throw error;
        }
    }

    generateKey(...parts) {
        return parts.join(':');
    }
}

module.exports = new Cache();
