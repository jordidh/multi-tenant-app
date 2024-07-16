const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./api/logger');
const database = require('./api/database');
const mysql = require('mysql2');
const uniqid = require('uniqid');
const tenantdb = require('./api/tenantdb');
const orderRouter = require('./routes/order');
const orderLineRouter = require('./routes/order_line');
// const apiDocsV1 = require('./routes/v1/api-docs');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const warehouseRouter = require('./routes/warehouse');
const cleanRouter = require('./routes/clean-db-test');

const fs = require('fs');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Load .env file to process.env variables, if the file does not exist does nothing
require('dotenv').config();

// Check that the mandatory environment variables are set
if (!process.env.CRYPTO_KEY || !process.env.CRYPTO_IV || !process.env.CRYPTO_ALG) {
    logger.error('Some mandatory environment variables are not set');
    process.exit(1);
}

// Connect MySQL
const db = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_DATABASE || 'tenants_app',
    user: process.env.DB_USER || 'cbwms',
    password: process.env.DB_PASSWORD || '1qaz2wsx',
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
    charset: 'utf8mb4_unicode_ci',
    allowPublicKeyRetrieval: true
};

database.connect(db, function (err) {
    if (err) {
        console.error('Unable to connect to MySQL: ' + err);
        process.exit(1);
    } else {
        database.getPool().query('SELECT NOW();', function (err) {
            if (err) {
                console.error('Unable to execute query to MySQL: ' + err);
                process.exit(1);
            } else {
                console.log(`Connected to MySQL ${db.database} successfully`);
            }
        });
    }
});

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API documentation'
        }
    },
    apis: ['./routes/*.js'] // Verifica que aquesta línia inclou el camí correcte
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Gets all databases from mysql and adds to the connectionMap with tenantdb.connectAll(dbs)
async function getAllDatabase() {
    const conn = await database.getPromisePool().getConnection();
    const dbs = [];
    try {
        const sql = 'SELECT * FROM tenants ';
        const totalTenants = await conn.execute(sql);
        if (totalTenants.length !== 2) {
            throw new Error('Select * FROM tenants was not successful');
        }
        for (let i = 0; i < totalTenants[0].length; i++) {
            const tenant = totalTenants[0][i];
            const sql = 'SELECT db_name, db_username, db_password FROM tenants WHERE id = ?';
            const resultQuery = await conn.execute(sql, [tenant.id]);
            if (resultQuery.length !== 2 || resultQuery[0].length === 0) {
                throw new Error('Select db_name, db_username, db_password was not successful');
            }
            const db = {
                id: tenant.id,
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: resultQuery[0][0].db_username,
                password: resultQuery[0][0].db_password,
                database: resultQuery[0][0].db_name,
                connectionLimit: process.env.DB_CONNECTION_LIMIT || 10
            };
            dbs.push(db);
        }
        console.log(dbs);
        tenantdb.connectAll(dbs);
    } catch (e) {
        console.log('Error with getAllDatabase() from app.js. ' + e);
    }
}

async function createDBTest() {
    const DBTENANTSCRIPT = fs.readFileSync('scripts/db/db_tenant.sql', 'utf8');
    const DBTESTINSERTSCRIPT = fs.readFileSync('scripts/db/db_test_insert.sql', 'utf8');
    
    // Connection to mysql db
    const connToMySql = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'cbwms',
        password: process.env.DB_PASSWORD || '1qaz2wsx',
        database: 'mysql'
    });
    let conn = connToMySql.promise();

    // Create the new DB
    const dbCreated = await conn.execute('CREATE DATABASE IF NOT EXISTS db_test;');
    if (dbCreated.length !== 2) throw new Error('Test database not created');
    conn = await tenantdb.getPromisePool(999).getConnection();
    
    const tenantQueries = DBTENANTSCRIPT.split(';').filter(query => query.trim() !== '');
    for (const query of tenantQueries) {
        try {
            await conn.execute(query);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Duplicate entry for key PRIMARY: ${query}`);
            } else {
                console.log(`Error executing query: ${query} - ${error.message}`);
            }
        }
    }

    const testInsertQueries = DBTESTINSERTSCRIPT.split(';').filter(query => query.trim() !== '');
    for (const query of testInsertQueries) {
        try {
            await conn.execute(query);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Duplicate entry for key PRIMARY: ${query}`);
            } else {
                console.log(`Error executing query: ${query} - ${error.message}`);
            }
        }
    }
}

/**
 * Creates an user 'user_test' and a connection for the 'db_test' database.
 */
async function setDbTestConnection() {
    const conn = await database.getPromisePool().getConnection();
    try {
        let sql = 'SELECT user FROM mysql.user WHERE user = ?';
        let resultQuery = await conn.execute(sql, [process.env.DB_USER_TEST]);
        if (resultQuery[0].length === 1) {
            sql = `DROP USER ${process.env.DB_USER_TEST}@'${process.env.DB_HOST_TEST}'`;
            resultQuery = await conn.execute(sql);
        }
        sql = `CREATE USER ${process.env.DB_USER_TEST}@'${process.env.DB_HOST_TEST}' IDENTIFIED BY '${process.env.DB_PASSWORD_TEST}'`;
        resultQuery = await conn.execute(sql);
        if (resultQuery.length !== 2) throw new Error('User not created');
        const userPrivilege = await conn.execute(`GRANT ALL PRIVILEGES ON \`db_test\`.* TO '${process.env.DB_USER_TEST}'@'${process.env.DB_HOST_TEST}';`);
        if (userPrivilege.length !== 2) throw new Error('User privileges not conceded');
        const flushPrivileges = await conn.execute('FLUSH PRIVILEGES');
        if (flushPrivileges.length !== 2) throw new Error('Flush privileges not executed');
        const dbTest = {
            id: 999,
            db_host: process.env.DB_HOST,
            db_port: 3306,
            db_username: process.env.DB_USER_TEST,
            db_password: process.env.DB_PASSWORD_TEST,
            db_name: 'db_test',
            connectionLimit: process.env.DB_CONNECTION_LIMIT || 10
        };
        await tenantdb.addConnection(dbTest);

        sql = 'SHOW DATABASES LIKE "db_test"';
        resultQuery = await conn.execute(sql);
        if (resultQuery[0].length === 1) {
            sql = 'DROP DATABASE db_test';
            resultQuery = await conn.execute(sql);
            createDBTest();
        } else {
            createDBTest();
        }
    } catch (error) {
        logger.error('Error creating database db_test conection:', error);
    }
}

getAllDatabase();
setDbTestConnection();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(
    morgan(morganFormat, {
        stream: {
            write: (message) => logger.http(message.trim())
        }
    })
);

// Set Pug as the view engine
app.set('view engine', 'pug');

/**
 * Generate one uniqueid everytime API is called, to trace the client call
 */
app.use(async (req, res, next) => {
    const requestId = req.headers['x-request-id'];
    req.requestId = requestId || uniqid();
    next();
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/warehouse', warehouseRouter);
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/order', orderRouter);
app.use('/order_line', orderLineRouter);
app.use('/clean-db-test', cleanRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const NOT_FOUND = 404;
    logger.error(`ExpressJS: [${req.method}] ${req.originalUrl}: ${NOT_FOUND}: Not found`);
    next(createError(NOT_FOUND));
});

// error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    const status = err.status || 500;
    logger.error(`ExpressJS: [${req.method}] ${req.originalUrl}: ${status}: ${err.message}`);

    res.status(status);
});

logger.info(`Node environment = ${(process.env.NODE_ENV ? process.env.NODE_ENV : 'development')}`);

module.exports = app;