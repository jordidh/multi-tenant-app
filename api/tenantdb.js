const mysql = require('mysql2');

let connectionMap;

export async function connectAll (dbs) {
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
};

export function getPromisePool (dbId) {
    return connectionMap.get(dbId).promisePool;
};

export function addConnection (db) {
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
};

export function removeConnection (dbId) {
    connectionMap.delete(dbId);
};
