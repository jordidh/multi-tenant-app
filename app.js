const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// var logger = require('morgan');
const morgan = require('morgan');
const logger = require('./api/logger');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

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
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

logger.info(`Node environment = ${(process.env.NODE_ENV ? process.env.NODE_ENV : 'development')}`);

module.exports = app;
