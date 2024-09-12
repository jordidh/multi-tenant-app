const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const tenantdb = require('../../api/tenantdb'); // Import tenantdb
const fs = require('fs');

const TENANT_ID_TEST = 999; 

// API to setup the test database
router.post('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST_TEST,
            user: process.env.DB_USER_TEST,
            password: process.env.DB_PASSWORD_TEST
        });

        const dbName = process.env.DB_DATABASE_TEST;

        // Create the test database and use it
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);

        // Load the SQL schema to set up the initial database state
        await executeSql(connection, 'scripts/db/db_tenant.sql');
        await executeSql(connection, 'scripts/db/db_test_insert.sql');

        // Close the connection
        await connection.end();

        // Add the connection for tenant ID 999 after creating the database
        tenantdb.addTenantTestConnection();

        res.status(201).send({ message: `Test database '${dbName}' created and tenant connection added successfully` });
    } catch (error) {
        console.error('Error setting up test database:', error);
        res.status(500).send({ error: 'Failed to create test database' });
    }
});


// API to drop the test database after tests
router.delete('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST_TEST,
            user: process.env.DB_USER_TEST,
            password: process.env.DB_PASSWORD_TEST
        });

        const dbName = process.env.DB_DATABASE_TEST;
        // Drop the test database
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        await connection.end();

        // Remove the connection for tenant ID 999
        tenantdb.removeConnection(TENANT_ID_TEST);

        res.status(200).send({ message: `Test database '${dbName}' dropped successfully` });
    } catch (error) {
        console.error('Error cleaning up test database:', error);
        res.status(500).send({ error: 'Failed to drop test database' });
    }
});

module.exports = router;

async function executeSql(connection, sqlScript) {

    const setupScript = fs.readFileSync(sqlScript, 'utf8');
    const queries = setupScript.split(';').filter(query => query.trim() !== '');
    for (const query of queries) {
        await connection.query(query);
    }
}
