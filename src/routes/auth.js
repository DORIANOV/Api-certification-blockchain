const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Inscription
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, company } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer l'utilisateur
        const result = await pool.query(
            'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4) RETURNING id, email, name, company',
            [email, hashedPassword, name, company]
        );

        // Générer le token JWT
        const token = jwt.sign(
            { id: result.rows[0].id, email: result.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    name: result.rows[0].name,
                    company: result.rows[0].company
                },
                token
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de l\'inscription'
        });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = result.rows[0];

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                status: 'error',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    company: user.company
                },
                token
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la connexion'
        });
    }
});

module.exports = router;
