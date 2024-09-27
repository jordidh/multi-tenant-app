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
        host: process.env.DB_HOST,          // Use environment variable for host
        port: process.env.DB_PORT,          // Use environment variable for port
        user: process.env.DB_USER,          // Use environment variable for user
        password: process.env.DB_PASSWORD,  // Use environment variable for password
        database: process.env.DB_DATABASE,  // Use environment variable for database
        connectionLimit: process.env.DB_CONNECTION_LIMIT // Use environment variable for connection limit
    });

        const promisePool = pool.promise();
        connectionMap.set(db.id, { pool, promisePool });
    },

    // Add connection explicitly for tenant 999 using environment variables
addTenantTestConnection: function () {
    const pool = mysql.createPool({
        host: process.env.DB_HOST_TEST,        // Use the test database host from .env
        port: process.env.DB_PORT || 3306,     // Use the port from .env or default to 3306
        user: process.env.DB_USER_TEST,        // Use the test database user from .env
        password: process.env.DB_PASSWORD_TEST,// Use the test database password from .env
        database: process.env.DB_DATABASE_TEST,// Use the test database name from .env
        connectionLimit: process.env.DB_CONNECTION_LIMIT || 10 // Use the connection limit from .env or default to 10
    });

    //const promisePool = pool.promise();
    //connectionMap.set('999', promisePool); // Set tenant ID 999

        const promisePool = pool.promise();
        connectionMap.set(999, { pool, promisePool }); // Set tenant ID 999
    },

    // Remove a connection
    removeConnection: function (dbId) {
        connectionMap.delete(dbId);
    }
};