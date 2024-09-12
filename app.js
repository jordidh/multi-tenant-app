// Load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

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
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

// Set up middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport for authentication
app.use(passport.initialize());

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