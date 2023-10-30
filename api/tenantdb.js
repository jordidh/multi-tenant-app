const mysql = require('mysql2');

let connectionMap = new Map();

module.exports = {
    connectAll: async function (dbs) {
        connectionMap = new Map();
        for (const db of dbs) {
            const pool = mysql.createPool({
                host: db.host,
                port: db.port,
                user: db.user,
                password: db.password,
                database: db.database,
                connectionLimit: db.connectionLimit
            });
            const promisePool = pool.promise();
            connectionMap.set(db.id, { pool, promisePool });
        }
    },

    getPromisePool: function (dbId) {
        return connectionMap.get(dbId).promisePool;
    },

    addConnection: function (db) {
        const pool = mysql.createPool({
            host: db.host,
            port: db.port,
            user: db.user,
            password: db.password,
            database: db.database,
            connectionLimit: db.connectionLimit
        });
        const promisePool = pool.promise();
        connectionMap.set(db.id, { pool, promisePool });
    },

    removeConnection: function (dbId) {
        connectionMap.delete(dbId);
    }
};
