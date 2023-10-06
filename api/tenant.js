/**
 * Module to manage the tenant and its users
 */
const bcrypt = require('bcrypt'); // More info: https://en.wikipedia.org/wiki/Bcrypt
const database = require('./database');
const logger = require('./logger');
const uniqid = require('uniqid');
const ApiResult = require('./ApiResult');
const ApiError = require('./ApiError');

const BCRYPT_PASSWORD_SALT_ROUNDS = 12;
const BCRYPT_PASSWROD_MAX_LENGTH = 72;

module.exports = {

    /**
     * Function that hashes a password with a salt
     * @param {*} plainTextPassword
     * @param {*} saltRounds : Number of rounds to generate the salt
     * @returns : hashed password
     */
    hashPassword: async function (plainTextPassword, saltRounds) {
        if (plainTextPassword.length > BCRYPT_PASSWROD_MAX_LENGTH) {
            throw new Error(`Password too long, bcrypt does not allow passwords longer than ${BCRYPT_PASSWROD_MAX_LENGTH} characters.`);
        }
        const salt = await bcrypt.genSalt(saltRounds || BCRYPT_PASSWORD_SALT_ROUNDS);
        const hash = await bcrypt.hash(plainTextPassword, salt);
        return hash;
    },

    /**
     * Method that validates that a password respects the RegExp pattern
     * @param {*} plainTextPassword
     * @param {*} pattern : regular expression pattern to validate the password
     *  - Example for a password with minumim one letter, one digit and a minimum length of 8 characters: ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$
     *    Explanation:
     *     ^ asserts the start of the string.
     *     (?=.*[A-Z]) is a positive lookahead assertion that requires at least one letter (A-Za-z).
     *     (?=.*\d) is another positive lookahead assertion that requires at least one digit (0-9).
     *     [A-Za-z\d]{8,} matches any combination of uppercase letters, lowercase letters, and digits with a minimum length of 8 characters.
     *     $ asserts the end of the string.
     *    Other regexp:
     *     Minimum eight characters, at least one letter and one number:
     *     "^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"
     *     Minimum eight characters, at least one letter, one number and one special character:
     *     "^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
     *     Minimum eight characters, at least one uppercase letter, one lowercase letter and one number:
     *     "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$"
     *     Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:
     *     "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
     *     Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character:
     *     "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,10}$"
     * @returns : true if the password is valid, false otherwise
     */
    isValidPassword: function (plainTextPassword, pattern) {
        pattern = pattern || '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&^])[A-Za-z\\d@$!%*#?&^]{8,}$';
        const matchResults = plainTextPassword.match(pattern);
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

            // Get a free tenant db server
            const tenant = await getFreeServerAvailable(conn, tenantUuid);
            if (!tenant) {
                throw new Error('No free servers available or error updating tenantsdbservers');
            }

            // Insert tenant: if tenant name and host are repeated, the transaction will rollback
            sql = 'INSERT INTO tenants (uuid, db_name, db_host, db_username, db_password, db_port, created_at, updated_at) ' +
                  'VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())';
            const [tenantCreationResult] = await conn.execute(sql,
                [tenantUuid, tenant.dbName, tenant.dbHost, tenant.dbUsername, tenant.dbPassword, tenant.dbPort]);
            if (tenantCreationResult.affectedRows !== 1) {
                logger.error(`tenant.createTenant(): Error creating tenant ${tenantUuid} with sql ${sql}`);
                throw new Error(`Error creating tenant ${tenantUuid}`);
            }

            // Insert organization: if organization name or vat is repeated, the transaction will rollback
            // because the table has a unique index
            sql = 'INSERT INTO organizations (name, vat_number, country, city, zipcode, address, tenant_id, created_at, updated_at) ' +
                  'VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
            const [organizationCreationResult] = await conn.execute(sql,
                [organization.name, organization.vat_number, organization.country, organization.city, organization.zipcode, organization.address, tenantCreationResult.insertId]);
            if (organizationCreationResult.affectedRows !== 1) {
                logger.error(`tenant.createTenant(): Error creating organization ${organization.name} with sql ${sql}`);
                throw new Error(`Error creating organization ${organization.name}`);
            }

            // Hash the user password with a salt
            const hashedPassword = await this.hashPassword(user.password1, tenantUuid);

            // Insert user: if organization user_name or email is repeated, the transaction will rollback
            // because the table has a unique index
            sql = 'INSERT INTO users (first_name, last_name, user_name, password, password_salt, email, organization_id, created_at, updated_at) ' +
                  'VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
            const [userCreationResult] = await conn.execute(sql,
                [user.firstname, user.lastname, user.username, hashedPassword, tenantUuid, user.email, organizationCreationResult.insertId]);
            if (userCreationResult.affectedRows !== 1) {
                logger.error(`tenant.createTenant(): Error creating user ${user.username} with sql ${sql}`);
                throw new Error(`Error creating user ${user.username}`);
            }

            await conn.commit();
            logger.info('tenant.createTenant(): Transaction committed');

            // status, data, requestId, errors
            return new ApiResult(200, 'Tenant created successfully', 1, []);
        } catch (e) {
            logger.error(`tenant.createTenant(): Error creating tenant: ${e}`);
            await conn.rollback();
            logger.info('tenant.createTenant(): Transaction rolled back');
            const error = new ApiError('REG01', `Error creating tenant ${e.message}`, '', '');
            return new ApiResult(500, 'Error creating tenant', 1, [error]);
        }
    }
};

async function getFreeServerAvailable (conn, tenantUuid) {
    // Initialize tenant object
    // TODO: generate a reandom password
    const tenant = {
        dbName: `db-${tenantUuid}`,
        dbUsername: `user-${tenantUuid}`,
        dbPassword: 'password',
        dbHost: 'localhost' || process.env.DB_HOST,
        dbPort: '3306' || process.env.DB_PORT,
        current_db: 0,
        max_db: 0
    };

    // Find free servers and lock the row and any associated index,
    // so that other transactions will be prevented from updating any of those rows
    // An error can use more databases of a server than the maximum allowed
    let sql = 'SELECT * FROM tenantsdbservers ' +
              'WHERE current_databases < max_databases AND locked = false ' +
              'ORDER BY priority ASC LIMIT 1 ' +
              'FOR UPDATE';
    const [serverFound] = await conn.execute(sql, []);
    if (serverFound.length <= 0) {
        logger.error(`tenant.createTenant(): Error finfing free tenantsdbservers with sql ${sql}`);
        return null;
    }

    tenant.dbHost = serverFound[0].db_host;
    tenant.dbPort = serverFound[0].db_port;
    tenant.current_db = serverFound[0].current_databases + 1;
    tenant.max_db = serverFound[0].max_databases;

    // Update tenantsdbservers with the new tenant
    sql = 'UPDATE tenantsdbservers SET current_databases = current_databases + 1 WHERE id = ?';
    const [updateResult] = await conn.execute(sql, [serverFound[0].id]);
    if (updateResult.affectedRows !== 1) {
        logger.error(`tenant.createTenant(): Error updating tenantsdbservers with sql ${sql}`);
        return null;
    }

    return tenant;
}
