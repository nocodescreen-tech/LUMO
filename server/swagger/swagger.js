const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API LUMO Pro',
            version: '1.0.0',
            description: 'Documentation de l\'API LUMO Pro avec PostgreSQL',
            contact: {
                name: 'Developer',
            },
            servers: [`http://localhost:${config.port}`],
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nom: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', enum: ['admin', 'superadmin', 'caissier'] }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nom: { type: 'string' },
                        prix: { type: 'number' },
                        stock: { type: 'integer' },
                        stockAlerte: { type: 'integer' },
                        categorie: { type: 'string' },
                        codeBarre: { type: 'string' }
                    }
                },
                Sale: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        montantTotal: { type: 'number' },
                        methodePaiement: { type: 'string' },
                        statut: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        articles: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    nom: { type: 'string' },
                                    prixUnitaire: { type: 'number' },
                                    quantite: { type: 'integer' }
                                }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./routes/*.js'], // Chemins vers vos fichiers de routes pour extraire les docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    console.log('📖 Documentation Swagger disponible sur /api-docs');
};

module.exports = setupSwagger;
