const mysql = require('mysql2');

// var pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   database: 'code_biting',
//   waitForConnections: true,
//   connectionLimit: 10,
//   maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
//   idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
//   queueLimit: 0
// });

// var config = require('../config/config');

const state = {
    pool: null,
    promisePool: null
};

exports.connect = function (db, done) {
    if (db.port) {
        state.pool = mysql.createPool({
            host: db.host,
            port: db.port,
            user: db.user,
            password: db.password,
            database: db.database,
            connectionLimit: db.connectionLimit
        });
    } else {
        state.pool = mysql.createPool({
            host: db.host,
            user: db.user,
            password: db.password,
            database: db.database,
            connectionLimit: db.connectionLimit
        });
    }
    state.promisePool = state.pool.promise();

    done();
};

exports.getPool = function () {
    return state.pool;
};

exports.getPromisePool = function () {
    return state.promisePool;
};
