const Joi = require('joi');

const validateRegister = (data) => {
    console.log(`--- [LUMO_VAL_STAMP_${Date.now()}] ---`);
    const schema = Joi.object({
        nom: Joi.string().required().messages({
            'string.empty': 'Veuillez saisir votre nom complet (Propriétaire)',
            'any.required': 'Le nom du propriétaire est obligatoire'
        }).label('Nom du Propriétaire'),
        email: Joi.string().email().required().messages({
            'string.email': 'Veuillez entrer une adresse email valide',
            'string.empty': "L'adresse email est obligatoire",
            'any.required': "L'email est requis pour l'inscription"
        }).label('Email'),
        motDePasse: Joi.string().min(8).required().messages({
            'string.min': 'Le mot de passe doit contenir au moins 8 caractères pour votre sécurité',
            'string.empty': 'Un mot de passe est indispensable',
            'any.required': 'Le mot de passe est obligatoire'
        }).label('Mot de passe'),
        typeActivite: Joi.string().optional(),
        telephone: Joi.string().optional(),
        entrepriseNom: Joi.string().required().messages({
            'string.empty': "Le nom de votre commerce est indispensable pour finaliser l'inscription",
            'any.required': "Veuillez fournir un nom pour votre commerce"
        }).label("Nom de l'entreprise"),
        devise: Joi.string().optional(),
        ville: Joi.string().optional()
    }).unknown(true);
    return schema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        motDePasse: Joi.string().required()
    });
    return schema.validate(data);
};

const validateProduct = (data) => {
    const schema = Joi.object({
        nom: Joi.string().required(),
        prix: Joi.number().positive().required(),
        categorie: Joi.string().required(),
        stock: Joi.number().integer().min(0),
        stockAlerte: Joi.number().integer().min(0),
        description: Joi.string().allow(''),
        image: Joi.string().allow('')
    });
    return schema.validate(data);
};

module.exports = {
    validateRegister,
    validateLogin,
    validateProduct
};
