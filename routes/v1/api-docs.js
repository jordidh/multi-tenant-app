const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const express = require('express');
const app = express();

// Basic Meta Informations about our API
const options = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Multi-tenant-app', version: '1.0.0' }
    },
    apis: [
        './routes/warehouse.js',
        './api/ApiResult.js'
    ]
};

const swaggerDocs = swaggerJSDoc(options);
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

module.exports = app;
