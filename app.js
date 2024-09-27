// Load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const database = require('./api/database');
const tenantdb = require('./api/tenantdb'); // Added this import
const cookieParser = require('cookie-parser');
const logger = require('morgan'); // Middleware for logging HTTP requests
const passport = require('passport'); // Authentication middleware
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const uniqid = require('uniqid'); // For unique request IDs
const fs = require('fs');
const mysql = require('mysql2');

// Swagger dependencies
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import routers
const indexRouter = require('./routes/index');
const dbTestSetupRouter = require('./routes/v1/db-test');  // For DB test setup
const orderRouter = require('./routes/v1/order');          // Order route
const orderLineRouter = require('./routes/v1/order_line'); // Order Line route
const warehouseRouter = require('./routes/v1/warehouse');  // Warehouse route
const customerRouter = require('./routes/v1/customer');    // Customer route

const app = express();

// Set up view engine as 'pug'
app.set('views', path.join(__dirname, 'views'));  // Set the directory for views (templates)
app.set('view engine', 'pug');

// Ensure that mandatory environment variables are set for encryption and security
if (!process.env.CRYPTO_KEY || !process.env.CRYPTO_IV || !process.env.CRYPTO_ALG) {
    console.error('Some mandatory environment variables are not set');
    process.exit(1); // Terminate the process if variables are missing
}

// Middleware to generate a unique request ID for each request
app.use(async (req, res, next) => {
    const requestId = req.headers['x-request-id'];
    req.requestId = requestId || uniqid();
    next();
});

// Set up middlewares
app.use(logger('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Multi-tenant API documentation',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}/v1`,
            },
        ],
    },
    apis: ['./routes/v1/*.js'], // Path to the API docs in the routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Swagger route for API docs

// Configure Passport to use JWT strategy
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET 
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    // Example logic to handle JWT payload
    User.findById(jwt_payload.sub, (err, user) => {
        if (err) return done(err, false);
        if (user) return done(null, user);
        return done(null, false);
    });
}));

// Initialize Passport for authentication
app.use(passport.initialize());

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'tenants_app',
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10
};

// Connect to the database pool
database.connect(dbConfig, (err) => {
    if (err) {
        console.error('Unable to connect to MySQL:', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL successfully');

        // Call this function to initialize all tenant databases
        getAllDatabase();
    }
});

// Function to connect to MySQL and add databases to the connection pool
async function getAllDatabase() {
    try {
        console.log('Connecting to database pool...'); // Debugging line
        const conn = await database.getPromisePool().getConnection();
        console.log('Database connection established:'); // Debugging line

        const dbs = [];
        const sql = 'SELECT * FROM tenants';
        const totalTenants = await conn.execute(sql);

        for (let i = 0; i < totalTenants[0].length; i++) {
            const tenant = totalTenants[0][i];
            const dbConfig = {
                id: tenant.id,
                host: tenant.db_host, 
                port: tenant.db_port, 
                user: tenant.db_username, 
                password: tenant.db_password,
                database: tenant.db_name, 
                connectionLimit: process.env.DB_CONNECTION_LIMIT || 10
            };
            dbs.push(dbConfig);
        }

        tenantdb.connectAll(dbs);
    } catch (e) {
        console.error('Error with getAllDatabase(): ' + e.message);
    }
}

// Define routes
app.use('/', indexRouter);
app.use('/v1/db-test', dbTestSetupRouter);  // DB test setup
app.use('/v1/order', orderRouter);          // Order route
app.use('/v1/order_line', orderLineRouter); // Order Line route
app.use('/v1/warehouse', warehouseRouter);  // Warehouse route
app.use('/v1/customer', customerRouter);    // Customer route

// Handle 404 errors
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// General error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;