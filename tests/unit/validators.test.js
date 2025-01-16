const { registerSchema, loginSchema } = require('../../src/validators/auth.validator');
const { createWorkSchema } = require('../../src/validators/work.validator');

describe('Auth Validators', () => {
    describe('Register Schema', () => {
        it('should validate correct registration data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Test123!@#',
                name: 'Test User',
                company: 'Test Company'
            };

            const { error } = registerSchema.validate(validData);
            expect(error).toBeUndefined();
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'Test123!@#',
                name: 'Test User'
            };

            const { error } = registerSchema.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('email');
        });

        it('should reject weak password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'weak',
                name: 'Test User'
            };

            const { error } = registerSchema.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('password');
        });
    });

    describe('Login Schema', () => {
        it('should validate correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Test123!@#'
            };

            const { error } = loginSchema.validate(validData);
            expect(error).toBeUndefined();
        });

        it('should reject missing fields', () => {
            const invalidData = {
                email: 'test@example.com'
            };

            const { error } = loginSchema.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('password');
        });
    });
});

describe('Work Validators', () => {
    describe('Create Work Schema', () => {
        it('should validate correct work data', () => {
            const validData = {
                title: 'Test Artwork',
                contentHash: '0x' + '1'.repeat(64),
                royaltyRecipients: [
                    '0x' + '2'.repeat(40),
                    '0x' + '3'.repeat(40)
                ],
                shares: [7000, 3000],
                metadata: {
                    description: 'Test description',
                    category: 'Digital Art',
                    tags: ['test', 'art']
                }
            };

            const { error } = createWorkSchema.validate(validData);
            expect(error).toBeUndefined();
        });

        it('should reject invalid content hash', () => {
            const invalidData = {
                title: 'Test Artwork',
                contentHash: 'invalid-hash',
                royaltyRecipients: ['0x' + '2'.repeat(40)],
                shares: [10000]
            };

            const { error } = createWorkSchema.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('contentHash');
        });

        it('should reject invalid royalty shares total', () => {
            const invalidData = {
                title: 'Test Artwork',
                contentHash: '0x' + '1'.repeat(64),
                royaltyRecipients: ['0x' + '2'.repeat(40)],
                shares: [5000] // Seulement 50%
            };

            const { error } = createWorkSchema.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('shares');
        });
    });
});
