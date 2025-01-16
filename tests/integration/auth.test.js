const request = require('supertest');
const app = require('../../src/index');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL
});

describe('Auth Routes', () => {
    beforeEach(async () => {
        // Nettoyer la base de données avant chaque test
        await pool.query('DELETE FROM users');
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Test123!@#',
                name: 'Test User',
                company: 'Test Company'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user).toHaveProperty('email', userData.email);
            expect(response.body.data).toHaveProperty('token');
        });

        it('should return validation error for invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'Test123!@#',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    field: 'email'
                })
            );
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Créer un utilisateur de test
            const userData = {
                email: 'test@example.com',
                password: 'Test123!@#',
                name: 'Test User'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login successfully with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!@#'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('token');
            
            // Vérifier que le token est valide
            const decodedToken = jwt.verify(response.body.data.token, process.env.JWT_SECRET);
            expect(decodedToken).toHaveProperty('email', loginData.email);
        });

        it('should return error for incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword123!@#'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Email ou mot de passe incorrect');
        });
    });
});
