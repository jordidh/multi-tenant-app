const mysql = require('mysql2');

let connectionMap = new Map();

module.exports = {
    // Initialize connections for all databases
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

    // Retrieve the promise pool for a given tenant ID
    getPromisePool: function (dbId) {
        const connection = connectionMap.get(dbId);
        if (!connection) {
            throw new Error(`No database connection for tenant ID ${dbId}`);
        }
        return connection.promisePool;
    },

    // Add a new connection manually
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

    // Add connection explicitly for tenant 999
    addTenantTestConnection: function () {
        const pool = mysql.createPool({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root',
            database: 'db_test_insert', // Ensure this matches your test database name
            connectionLimit: 10
        });
        const promisePool = pool.promise();
        connectionMap.set(999, { pool, promisePool }); // Set tenant ID 999
    },

    // Remove a connection
    removeConnection: function (dbId) {
        connectionMap.delete(dbId);
    }
};