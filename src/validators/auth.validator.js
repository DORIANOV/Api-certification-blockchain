const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'L\'email doit être valide',
            'any.required': 'L\'email est requis'
        }),
    
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
            'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
            'any.required': 'Le mot de passe est requis'
        }),
    
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Le nom doit contenir au moins 2 caractères',
            'string.max': 'Le nom ne peut pas dépasser 100 caractères',
            'any.required': 'Le nom est requis'
        }),
    
    company: Joi.string()
        .max(200)
        .optional()
        .messages({
            'string.max': 'Le nom de l\'entreprise ne peut pas dépasser 200 caractères'
        })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'L\'email doit être valide',
            'any.required': 'L\'email est requis'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Le mot de passe est requis'
        })
});

module.exports = {
    registerSchema,
    loginSchema
};
