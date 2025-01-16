const request = require('supertest');
const app = require('../../src/index');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL
});

describe('Works Routes', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Créer un utilisateur et générer un token
        const userData = {
            email: 'artist@example.com',
            password: 'Artist123!@#',
            name: 'Test Artist'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userData);

        authToken = response.body.data.token;
        userId = response.body.data.user.id;
    });

    beforeEach(async () => {
        // Nettoyer la table des œuvres avant chaque test
        await pool.query('DELETE FROM works');
    });

    describe('POST /api/works', () => {
        it('should register a new work successfully', async () => {
            const workData = {
                title: 'Test Artwork',
                contentHash: '0x' + '1'.repeat(64),
                royaltyRecipients: [
                    '0x' + '2'.repeat(40),
                    '0x' + '3'.repeat(40)
                ],
                shares: [7000, 3000], // 70% et 30%
                metadata: {
                    description: 'Test artwork description',
                    category: 'Digital Art',
                    tags: ['test', 'digital']
                }
            };

            const response = await request(app)
                .post('/api/works')
                .set('Authorization', `Bearer ${authToken}`)
                .send(workData);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('tokenId');
            expect(response.body.data).toHaveProperty('transactionHash');
        });

        it('should return validation error for invalid shares total', async () => {
            const workData = {
                title: 'Test Artwork',
                contentHash: '0x' + '1'.repeat(64),
                royaltyRecipients: [
                    '0x' + '2'.repeat(40),
                    '0x' + '3'.repeat(40)
                ],
                shares: [6000, 3000], // 60% + 30% = 90%, devrait être 100%
            };

            const response = await request(app)
                .post('/api/works')
                .set('Authorization', `Bearer ${authToken}`)
                .send(workData);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    field: 'shares'
                })
            );
        });
    });

    describe('GET /api/works/:tokenId', () => {
        let tokenId;

        beforeEach(async () => {
            // Créer une œuvre pour les tests
            const workData = {
                title: 'Test Artwork',
                contentHash: '0x' + '1'.repeat(64),
                royaltyRecipients: ['0x' + '2'.repeat(40)],
                shares: [10000]
            };

            const response = await request(app)
                .post('/api/works')
                .set('Authorization', `Bearer ${authToken}`)
                .send(workData);

            tokenId = response.body.data.tokenId;
        });

        it('should retrieve work details successfully', async () => {
            const response = await request(app)
                .get(`/api/works/${tokenId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('title', 'Test Artwork');
            expect(response.body.data).toHaveProperty('contentHash');
            expect(response.body.data).toHaveProperty('creator');
        });

        it('should return 404 for non-existent work', async () => {
            const response = await request(app)
                .get('/api/works/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('error');
        });
    });
});
