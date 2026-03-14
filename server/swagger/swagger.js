const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API HubCommerce Pro',
            version: '1.0.0',
            description: 'Documentation de l\'API HubCommerce Pro avec PostgreSQL',
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
