/**
 * Module to manage the tenant and its users
 */
const bcrypt = require('bcrypt'); // More info: https://en.wikipedia.org/wiki/Bcrypt
const crypto = require('crypto');
const database = require('./database');
const logger = require('./logger');
const uniqid = require('uniqid');
const generator = require('generate-password');
const ApiResult = require('./ApiResult');
const ApiError = require('./ApiError');
const tenantdb = require('./tenantdb');
const mysql = require('mysql2');
const fs = require('fs');

// 'readFileSync' creates a string with the script of db_tenant.sql and stores it in TENANTSCRIPT
const TENANTSCRIPT = fs.readFileSync('scripts/db/db_tenant.sql', 'utf8');
const BCRYPT_PASSWORD_SALT_ROUNDS = 12;
const BCRYPT_PASSWROD_MAX_LENGTH = 72;
const PASSNOTEQUAL = 'Passwords are not equal.';
const ERRORPATTERNPASS = 'Error the password must have: 8 characters, one lowercase letter, one uppercase letter, one digit and one character: @$!%*#?&^';
const PATTERN_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,}$/;
/* PATTERN_PASSWORD : regular expression pattern to validate the password
     *  - Example for a password with minumim one letter, one digit and a minimum length of 8 characters: ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$
     *    Explanation:
     *     ^ asserts the start of the string.
     *     (?=.*[A-Z]) is a positive lookahead assertion that requires at least one uppercase letter (A-Z).
     *     (?=.*[a-z]) is a positive lookahead assertion that requires at least one lowercase letter (a-z).
     *     (?=.*\d) is a positive lookahead assertion that requires at least one digit (0-9).
     *     (?=.*[@$!%*#?&^]) is another positive lookahead assertion that requires at least one special character (@$!%*#?&^).
     *     [A-Za-z\\d@$!%*#?&^]{8,} matches any combination of uppercase letters, lowercase letters, digits and special characters with a minimum length of 8 characters.
     *     $ asserts the end of the string.
     */

module.exports = {

    PATTERN_PASSWORD,
    PASSNOTEQUAL,
    ERRORPATTERNPASS,
    /**
     * Method that validates that a password respects the RegExp pattern
     * @param {*} plainTextPassword
     * @returns : true if the password is valid, false otherwise
     */
    isValidPassword: function (plainTextPassword) {
        const matchResults = plainTextPassword.match(PATTERN_PASSWORD);
        return (matchResults !== null);
    },

    /**
     * Method that compares a plain text password with a hashed password
     * @param {*} plainTextPassword
     * @param {*} hashedPassword : loaded from the database
     * @returns : true if the passwords match, false otherwise
     */
    comparePasswords: async function (plainTextPassword, hashedPassword) {
        return await bcrypt.compare(plainTextPassword, hashedPassword);
    },

    /**
     * Creates a new tenant, a new organization a a new user
     * @param {*} organization : object with attributes: organization, vatnumber, country, city, zipcode, address
     * @param {*} user : object with attributes: firstname, lastname, username, password1, email
     * @returns : ApiResult with the tenant uuid and the activation link
     */
    createTenant: async function (organization, user) {
        let sql = '';

        const conn = await database.getPromisePool().getConnection();

        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            // Check username and user email are not already in use
            sql = 'SELECT * FROM users WHERE user_name = ? OR email = ?';
            const [usersFound] = await conn.execute(sql, [user.username, user.email]);
            if (usersFound.length > 0) {
                throw new Error(`Username ${user.username} or email ${user.email} already in use`);
            }

            // Check organization name and vat number are not already in use
            sql = 'SELECT * FROM organizations WHERE name = ? OR vat_number = ?';
            const [organizationsFound] = await conn.execute(sql, [organization.name, organization.vat_number]);
            if (organizationsFound.length > 0) {
                throw new Error(`Organization name ${organization.name} or vat number ${organization.vat_number} already in use`);
            }

            // Generate tenant uuid
            const tenantUuid = uniqid();

            // Hash the user password with a salt
            const hashedPassword = await hashPassword(user.password1);
            // Get a free tenant db server
            const tenantDb = await reserveDBServer(conn, tenantUuid);
            if (!tenantDb) {
                throw new Error('No free servers available or error updating tenantsdbservers');
            }

            // Create the tenant, organization and user
            const tenant = await createOrganizationTenant(conn, tenantUuid, tenantDb, organization, user, hashedPassword);
            if (!tenant) {
                throw new Error('Error creating tenant, organizaton or user');
            }

            // Create the activation link
            const activationLink = await createActivationLink(conn, tenantUuid, tenant.userId);
            if (!activationLink) {
                throw new Error('Error creating activation link');
            }

            // TODO: send the lik via email

            await conn.commit();
            logger.info('tenant.createTenant(): Transaction committed');

            // status, data, requestId, errors
            return new ApiResult(200, { message: 'Tenant created successfully', tenantUuid, activationLink }, 1, []);
        } catch (e) {
            logger.error(`tenant.createTenant(): Error creating tenant: ${e}`);
            await conn.rollback();
            logger.info('tenant.createTenant(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error creating tenant', 1, [error]);
        }
    },
    activateAccount: async function (tenant, user, code) {
        const conn = await database.getPromisePool().getConnection();
        try {
            await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
            await conn.beginTransaction();

            let sql = 'SELECT activation_code FROM activationcodes WHERE user_id = ? AND valid = 1';
            const [aCodeExists] = await conn.query(sql, [user]);

            if (aCodeExists && aCodeExists.length > 0) {
                const activationCodeHashed = await bcrypt.compare(code, aCodeExists[0].activation_code);
                if (activationCodeHashed) {
                    sql = 'UPDATE users SET locked = false WHERE id = ?';
                    await conn.execute(sql, [user]);
                    /* if (!activatedUser) {
                        throw new Error('Error activating user');
                    } */

                    sql = 'UPDATE activationcodes SET valid = false WHERE activation_code LIKE ?';
                    const [invalidateLink] = await conn.execute(sql, [aCodeExists[0].activation_code]);
                    if (!invalidateLink) {
                        throw new Error('Error invalidating activation link');
                    }

                    await conn.commit();

                    // CREATE Tenant
                    sql = 'SELECT t.* FROM tenants t JOIN organizations o ON t.id = o.tenant_id JOIN users u ON o.id = u.organization_id WHERE u.id = ?';
                    const [userTenantData] = await conn.execute(sql, [user]);

                    const userDb = await createUserDB(user, userTenantData[0].uuid, conn);
                    if (!userDb) {
                        throw new Error('Error creating user database');
                    }

                    // addConnection
                    tenantdb.addConnection(userTenantData[0]);
                    return new ApiResult(200, '', 1, []);
                } else {
                    throw new Error('Error activation code not found or invalid');
                }
            } else {
                throw new Error('Activation code not found or not valid');
            }
        } catch (e) {
            logger.error(`tenant.activateAccount: Error activating user: ${e}`);
            await conn.rollback();
            logger.info('tenant.activateAccount(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error during the activation process', 1, [error]);
        }
    },

    loginDb: async function (user, passwd) {
        // TODO: login into user db
    }
};

async function createOrganizationTenant (conn, tenantUuid, tenant, organization, user, hashedPassword) {
    // Insert tenant: if tenant name and host are repeated, the transaction will rollback
    let sql = 'INSERT INTO tenants (uuid, db_name, db_host, db_username, db_password, db_port, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())';
    const [tenantCreationResult] = await conn.execute(sql,
        [tenantUuid, tenant.dbName, tenant.dbHost, tenant.dbUsername, tenant.dbPasswordEncrypted, tenant.dbPort]);
    if (tenantCreationResult.affectedRows !== 1) {
        logger.error(`tenant.createOrganizationTenant(): Error creating tenant ${tenantUuid} with sql ${sql}`);
        return null; // throw new Error(`Error creating tenant ${tenantUuid}`);
    }

    // Insert organization: if organization name or vat is repeated, the transaction will rollback
    // because the table has a unique index
    sql = 'INSERT INTO organizations (name, vat_number, country, city, zipcode, address, tenant_id, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
    const [organizationCreationResult] = await conn.execute(sql,
        [organization.name, organization.vat_number, organization.country, organization.city, organization.zipcode, organization.address, tenantCreationResult.insertId]);
    if (organizationCreationResult.affectedRows !== 1) {
        logger.error(`tenant.createOrganizationTenant(): Error creating organization ${organization.name} with sql ${sql}`);
        return null; // throw new Error(`Error creating organization ${organization.name}`);
    }

    // Insert user: if organization user_name or email is repeated,
    // the transaction will rollback because the table has a unique index
    // By default the user is not active (locked=true),
    // the user must activate the account by clicking on the activation link
    sql = 'INSERT INTO users (first_name, last_name, user_name, password, password_salt, email, organization_id, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
    const [userCreationResult] = await conn.execute(sql,
        [user.firstname, user.lastname, user.username, hashedPassword, tenantUuid, user.email, organizationCreationResult.insertId]);
    if (userCreationResult.affectedRows !== 1) {
        logger.error(`tenant.createOrganizationTenant(): Error creating user ${user.username} with sql ${sql}`);
        return null; // throw new Error(`Error creating user ${user.username}`);
    }

    return {
        userId: userCreationResult.insertId,
        organizationId: organizationCreationResult.insertId,
        tenantId: tenantCreationResult.insertId
    };
}

/**
 * Searches for a server with available databases and updates the tenantsdbservers table to reserve one database
 * This function can identify on which server the tenant database is located
 * @param {*} conn : databa se connection
 * @param {*} tenantUuid : tenant uuid
 * @returns: null if error, otherwise an object with the tenant attributes
 */
async function reserveDBServer (conn, tenantUuid) {
    /*
    // Update tenantsdbservers with the new tenant
    // Select and update in one sentence to avoid errors and innecessary locks
    // ===> This is not working, the update is not returning the updated row
    let sql = 'SET @uid := NULL; ' +
          'UPDATE tenantsdbservers SET current_databases = current_databases + 1 WHERE id = @uid := ( ' +
          'SELECT * FROM ( ' +
          '  SELECT id FROM tenantsdbservers ' +
          '  WHERE current_databases < max_databases AND locked = false ' +
          '  ORDER BY priority ASC LIMIT 1) ' +
          ' AS t); ' +
          'SELECT @uid;';
    const [updateResult] = await conn.execute(sql, []);
    if (updateResult.affectedRows !== 1) {
        logger.error(`tenant.getFreeServerAvailable(): Error finding or updating tenantsdbservers with sql ${sql}`);
        return null;
    }

    // Get updated server
    sql = 'SELECT * FROM tenantsdbservers WHERE id = ?';
    const [tenantDbServer] = await conn.execute(sql, [updateResult.updateId]);
    if (tenantDbServer.length <= 0) {
        logger.error(`tenant.getFreeServerAvailable(): Error finding updated tenantsdbservers with sql ${sql}`);
        return null;
    }
    */

    // Select and lock the server to increment the current_databases
    let sql = 'SELECT * FROM tenantsdbservers ' +
          'WHERE current_databases < max_databases AND locked = false ' +
          'ORDER BY priority ASC LIMIT 1 ' +
          'FOR UPDATE';
    const [serverFound] = await conn.execute(sql, []);
    if (serverFound.length <= 0) {
        logger.error(`tenant.getFreeServerAvailable(): Error finding available database in tenantsdbservers with sql ${sql}`);
        return null;
    }

    // Updated server
    sql = 'UPDATE tenantsdbservers SET current_databases = current_databases + 1 WHERE id = ?';
    const [updatedServer] = await conn.execute(sql, [serverFound[0].id]);
    if (updatedServer.affectedRows !== 1) {
        logger.error(`tenant.getFreeServerAvailable(): Error updating tenantsdbservers with sql ${sql}`);
        return null;
    }

    // Generate a random password
    // This password needs to be stored in a safe place, the database is not a good place
    // but for simplicity we store into the DB encrypted with a secret key
    const pass = generator.generate({
        length: 20,
        numbers: true,
        symbols: true,
        uppercase: true,
        strict: true
    });

    // Encrypt the password with a secret key
    const encryptedPassword = encryptSimetric(process.env.CRYPTO_ALG, process.env.CRYPTO_KEY, process.env.CRYPTO_IV, pass);

    // Return tenant object
    return {
        dbName: `db-${tenantUuid}`,
        dbUsername: `user-${tenantUuid}`,
        dbPassword: pass,
        dbPasswordEncrypted: encryptedPassword,
        dbHost: serverFound[0].db_host,
        dbPort: serverFound[0].db_port
    };
}

/*
function decryptSymetric (algorithm, key, iv, encrypted) {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
*/

function encryptSimetric (algorithm, key, iv, data) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

async function createActivationLink (conn, tenantUuid, userId) {
    // Generate a random activation code
    const activationCode = generator.generate({
        length: 20,
        numbers: true,
        // Set symbols to false to avoid have &, that will generate a new query to req
        symbols: false,
        uppercase: true,
        strict: true
    });

    const activationCodeHashed = await hashPassword(activationCode);
    // Create the link
    const link = encodeURI(`/activate?tenant=${tenantUuid}&user=${userId}&code=${activationCode}`);

    // Insert the activation code in the database
    const sql = 'INSERT INTO activationcodes (user_id, activation_code, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
    const [insertResult] = await conn.execute(sql, [userId, activationCodeHashed]);
    if (insertResult.affectedRows !== 1) {
        logger.error(`tenant.createActivationLink(): Error inserting activation code with sql ${sql}`);
        return null;
    }

    // Return the link
    return link;
}

/**
     * Function that hashes a password with a salt
     * @param {*} plainTextPassword
     * @param {*} saltRounds : Number of rounds to generate the salt
     * @returns : hashed password
     */
async function hashPassword (plainTextPassword, saltRounds) {
    if (plainTextPassword.length > BCRYPT_PASSWROD_MAX_LENGTH) {
        throw new Error(`Password too long, bcrypt does not allow passwords longer than ${BCRYPT_PASSWROD_MAX_LENGTH} characters.`);
    }
    const salt = await bcrypt.genSalt(saltRounds || BCRYPT_PASSWORD_SALT_ROUNDS);
    const hash = await bcrypt.hash(plainTextPassword, salt);
    return hash;
}

async function createUserDB (user, uuid) {
    try {
        // Connection to mysql db
        const connToMySql = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'cbwms',
            password: process.env.DB_PASSWORD || '1qaz2wsx',
            database: 'mysql'
        });
        // Promise to
        let conn = connToMySql.promise();

        // Create the new DB
        const dbCreated = await conn.execute(`CREATE DATABASE IF NOT EXISTS DB_USER_${user};`);
        if (dbCreated.length !== 2) throw new Error('User db not created');

        // Connection to new DB
        const connToUserDB = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'cbwms',
            password: process.env.DB_PASSWORD || '1qaz2wsx',
            database: `DB_USER_${user}`
        });
        // Change promise to the new DB connection
        conn = connToUserDB.promise();

        /**
         * TENANTSCRIPT contains all the queries inside a single String, but the 'execute' method only accepts one query at a time.
         * Therefore, we need to create an Array using 'split' with ';' as the separator.
         * 'queries' is an Array containing all the queries, but some positions can be occupied with '', which we can fix using 'trim'.
         * 'filter' creates an Array with the Strings that meet the condition (having other characters after deleting white spaces with trim).
         * The loop 'for' serves to iterate every query as a single string.
         * */
        const queries = TENANTSCRIPT.split(';');
        const validQueries = queries.filter(query => query.trim() !== '');
        let tablesTenant;
        for (const query of validQueries) {
            tablesTenant = await conn.execute(query);
            if (tablesTenant.length !== 2) throw new Error(`Tenant tables not created, executing query ${query}`);
        }

        // Insert initial data into location
        const insertIntoLocation = await conn.execute("INSERT INTO location (code, description) VALUES ('UBIC01' ,'descripcio de prova');");
        if (insertIntoLocation.length !== 2 || insertIntoLocation[0].affectedRows !== 1) {
            throw new Error('Couldn\'t insert values into location');
        }

        console.log('Database and tables successfully created.');
        return true;
    } catch (error) {
        console.error('Error creating database and tables:', error);
        return false;
    }
}
