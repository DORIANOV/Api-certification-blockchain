const Joi = require('joi');

const createWorkSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
            'string.min': 'Le titre ne peut pas être vide',
            'string.max': 'Le titre ne peut pas dépasser 255 caractères',
            'any.required': 'Le titre est requis'
        }),
    
    contentHash: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{64}$/)
        .required()
        .messages({
            'string.pattern.base': 'Le hash du contenu doit être un hash Keccak-256 valide',
            'any.required': 'Le hash du contenu est requis'
        }),
    
    royaltyRecipients: Joi.array()
        .items(Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/))
        .min(1)
        .required()
        .messages({
            'array.min': 'Au moins un destinataire de royalties est requis',
            'string.pattern.base': 'Les adresses des destinataires doivent être des adresses Ethereum valides',
            'any.required': 'Les destinataires de royalties sont requis'
        }),
    
    shares: Joi.array()
        .items(Joi.number().integer().min(0).max(10000))
        .min(1)
        .custom((value, helpers) => {
            const sum = value.reduce((a, b) => a + b, 0);
            if (sum !== 10000) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .required()
        .messages({
            'array.min': 'Au moins une part de royalties est requise',
            'number.base': 'Les parts doivent être des nombres',
            'number.integer': 'Les parts doivent être des nombres entiers',
            'number.min': 'Les parts ne peuvent pas être négatives',
            'number.max': 'Les parts ne peuvent pas dépasser 100%',
            'any.invalid': 'La somme des parts doit être égale à 100% (10000)',
            'any.required': 'Les parts de royalties sont requises'
        }),

    metadata: Joi.object({
        description: Joi.string().max(1000).optional(),
        category: Joi.string().max(100).optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        externalUrl: Joi.string().uri().optional()
    }).optional()
});

module.exports = {
    createWorkSchema
};
