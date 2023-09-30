const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// var logger = require('morgan');
const morgan = require('morgan');
const logger = require('./api/logger');
const database = require('./api/database');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// Load .env file to provess.env variables, if the file does not exist does nothing
require('dotenv').config();

// Connect MySQL
const db = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_DATABASE || 'tenant_app',
    user: process.env.DB_USER || 'cbwms',
    password: process.env.DB_PASSWORD || '1qaz2wsx',
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10
};

database.connect(db, function (err) {
    if (err) {
        console.error('Unable to connect to MySQL: ' + err);
        process.exit(1);
    } else {
        database.get().query('SELECT NOW();', function (err) {
            if (err) {
                console.error('Unable to execute query to MySQL: ' + err);
                process.exit(1);
            } else {
                console.log(`Connected to MySQL ${db.database} successfully`);
            }
        });
    }
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(
    morgan(morganFormat, {
    // Function to determine if logging is skipped, defaults to false
    // skip: function(req, res) {
    //   // Skip logging when function has exit (returns status code < 400)
    //   return res.statusCode < 400;
    // },
        stream: {
            write: (message) => logger.http(message.trim())
        }
    })
);

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const NOT_FOUND = 404;
    logger.error(`ExpressJS: [${req.method}] ${req.originalUrl}: ${NOT_FOUND}: Not found`);
    next(createError(NOT_FOUND));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    const status = err.status || 500;
    logger.error(`ExpressJS: [${req.method}] ${req.originalUrl}: ${status}: ${err.message}`);

    res.status(status);
    res.render('error');
});

logger.info(`Node environment = ${(process.env.NODE_ENV ? process.env.NODE_ENV : 'development')}`);

module.exports = app;
