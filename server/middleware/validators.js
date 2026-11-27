const Joi = require('joi');

const validateRegister = (data) => {
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
        motDePasse: Joi.string()
            .min(8)
            .max(100)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])'))
            .required()
            .messages({
                'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
                'string.max': 'Le mot de passe ne peut pas dépasser 100 caractères',
                'string.pattern.base': 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial (@$!%*?&#)',
                'string.empty': 'Un mot de passe est indispensable',
                'any.required': 'Le mot de passe est obligatoire'
            }).label('Mot de passe'),
        typeActivite: Joi.string().valid('commerce-general', 'pharmacie', 'quincaillerie', 'boutique-mode').optional(),
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
    // Normalize: frontend sends prixVente, backend stores as prix
    // FormData sends numbers as strings, so we convert them
    const normalized = { ...data };
    if (normalized.prixVente !== undefined && normalized.prix === undefined) {
        normalized.prix = parseFloat(normalized.prixVente) || normalized.prixVente;
    }
    if (normalized.prix !== undefined && typeof normalized.prix === 'string') {
        normalized.prix = parseFloat(normalized.prix);
    }
    if (normalized.prixAchat !== undefined && typeof normalized.prixAchat === 'string') {
        normalized.prixAchat = parseFloat(normalized.prixAchat);
    }
    if (normalized.stock !== undefined && typeof normalized.stock === 'string') {
        normalized.stock = parseInt(normalized.stock, 10);
    }
    const schema = Joi.object({
        nom: Joi.string().required(),
        prix: Joi.number().min(0).required(),
        prixVente: Joi.number().min(0).optional(), // alias accepted
        prixAchat: Joi.number().min(0).optional(),
        categorie: Joi.string().required(),
        stock: Joi.number().integer().min(0).default(0),
        stockAlerte: Joi.number().integer().min(0).default(5),
        description: Joi.string().allow('', null),
        codeBarre: Joi.string().allow('', null),
        unite: Joi.string().optional(),
        devise: Joi.string().valid('USD', 'CDF').optional()
    }).unknown(true);
    return schema.validate(normalized);
};

const validateClient = (data) => {
    const schema = Joi.object({
        nom: Joi.string().required(),
        email: Joi.string().email().allow('', null),
        telephone: Joi.string().allow('', null),
        adresse: Joi.string().allow('', null)
    }).unknown(true);
    return schema.validate(data);
};

const validateFournisseur = (data) => {
    // entreprise can be derived from nom if missing (frontend only sends nom)
    const normalized = { ...data };
    if (!normalized.entreprise && normalized.nom) {
        normalized.entreprise = normalized.nom;
    }
    const schema = Joi.object({
        entreprise: Joi.string().required(),
        nom: Joi.string().required(),
        email: Joi.string().email().allow('', null),
        telephone: Joi.string().allow('', null),
        adresse: Joi.string().allow('', null),
        categorie: Joi.string().allow('', null)
    }).unknown(true);
    return schema.validate(normalized);
};



const validateSale = (data) => {
    const schema = Joi.object({
        items: Joi.array().items(Joi.object({
            id: Joi.number().integer().positive().required(),
            nom: Joi.string().required(),
            prix: Joi.number().min(0).required(),
            prixUnitaire: Joi.number().min(0).optional(),
            prixAchat: Joi.number().min(0).optional(),
            deviseProduit: Joi.string().valid('USD', 'CDF').optional(),
            quantite: Joi.number().integer().positive().required()
        }).unknown(true)).min(1).required(),
        montantTotal: Joi.number().min(0).required(),
        methodePaiement: Joi.string().required(),
        devise: Joi.string().valid('USD', 'CDF').required(),
        tauxChange: Joi.number().positive().optional()
    }).unknown(true);
    return schema.validate(data);
};

const validatePurchase = (data) => {
    const schema = Joi.object({
        numeroFacture: Joi.string().required(),
        montantTotal: Joi.number().min(0).required(),
        articles: Joi.array().items(Joi.object({id:Joi.number().integer().positive().allow(null).optional(),nom:Joi.string().optional(),quantite:Joi.number().integer().positive().required(),prixAchat:Joi.number().min(0).required(),prix:Joi.number().min(0).optional()}).unknown(true)).min(1).max(1000).required(),
        fournisseurId: Joi.number().allow(null, '').optional(),
        devise: Joi.string().valid('USD', 'CDF').optional()
    }).unknown(true);
    return schema.validate(data);
};

module.exports = {
    validateRegister,
    validateLogin,
    validateProduct,
    validateClient,
    validateFournisseur,
    validateSale,
    validatePurchase
};
