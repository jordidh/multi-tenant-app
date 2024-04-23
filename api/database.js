const mysql = require('mysql2');
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
