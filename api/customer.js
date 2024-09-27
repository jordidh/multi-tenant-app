const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new customer in the database
 * @param {object} conn - Database connection
 * @param {object} customerData - Customer data
 * @returns {object} - API result object
 */
async function createCustomer(conn, customerData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            'INSERT INTO `customer` (name, email, phone, address_id, version) VALUES (?, ?, ?, ?, ?)',
            [customerData.name, customerData.email, customerData.phone, customerData.address_id, customerData.version]
        );
        result.status = 201;
        result.data = { id: rows.insertId, ...customerData };
        await conn.commit();
        logger.info('Customer created successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('Error creating customer', error);
        result.errors.push(error.message);
    }
    return result;
}




/**
 * Updates an existing customer in the database
 * @param {object} conn - Database connection
 * @param {string} customerId - Customer ID
 * @param {object} customerData - Customer data
 * @returns {object} - API result object
 */
async function updateCustomer(conn, customerId, customerData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();

        // Log the incoming request data
        logger.info(`Updating customer with ID: ${customerId}`, customerData);

        // Fetch current version
        const [current] = await conn.execute(
            'SELECT version FROM `customer` WHERE id = ?',
            [customerId]
        );

        if (current.length === 0) {
            throw new Error('Customer not found');
        }

        const currentVersion = current[0].version;

        if (currentVersion !== customerData.version) {
            throw new Error('Version mismatch');
        }

        const [rows] = await conn.execute(
            'UPDATE `customer` SET name = ?, email = ?, phone = ?, address_id = ?, version = version + 1 WHERE id = ? AND version = ?',
            [customerData.name, customerData.email, customerData.phone, customerData.address_id, customerId, customerData.version]
        );

        if (rows.affectedRows === 0) {
            throw new Error('Customer not found or version mismatch');
        }

        result.status = 200;
        result.data = { id: customerId, ...customerData, version: currentVersion + 1 };
        await conn.commit();

        logger.info(`Customer with ID: ${customerId} updated successfully`, result.data);
    } catch (error) {
        await conn.rollback();

        // Log the error in detail
        logger.error(`Error updating customer with ID: ${customerId}`, error);

        result.errors.push(error.message);
    } finally {
        if (conn) conn.release(); // Ensure connection is released
    }

    return result;
}

module.exports = {
    updateCustomer
};
/*
async function updateCustomer(conn, customerId, customerData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            'UPDATE `customer` SET name = ?, email = ?, phone = ?, address_id = ?, version = version + 1 WHERE id = ? AND version = ?',
            [customerData.name, customerData.email, customerData.phone, customerData.address_id, customerId, customerData.version]
        );
        if (rows.affectedRows === 0) {
            throw new Error('Customer not found or version mismatch');
        }
        result.status = 200;
        result.data = { id: customerId, ...customerData, version: customerData.version + 1 };
        await conn.commit();
        logger.info('Customer updated successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('Error updating customer', error);
        result.errors.push(error.message);
    }
    return result;
}*/

/**
 * Deletes a customer from the database
 * @param {object} conn - Database connection
 * @param {string} customerId - Customer ID
 * @returns {object} - API result object
 */
async function deleteCustomer(conn, customerId) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            'DELETE FROM `customer` WHERE id = ?',
            [customerId]
        );
        if (rows.affectedRows === 0) {
            throw new Error('Customer not found');
        }
        result.status = 200;
        result.data = { id: customerId };
        await conn.commit();
        logger.info('Customer deleted successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('Error deleting customer', error);
        result.errors.push(error.message);
    }
    return result;
}

/**
 * Retrieves details of a customer from the database
 * @param {object} conn - Database connection
 * @param {string} customerId - Customer ID
 * @returns {object} - API result object
 */
async function getCustomerDetails(conn, customerId) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        const [rows] = await conn.execute(
            'SELECT * FROM `customer` WHERE id = ?',
            [customerId]
        );
        if (rows.length === 0) {
            throw new Error('Customer not found');
        }
        result.status = 200;
        result.data = rows[0];
        logger.info('Customer details retrieved successfully');
    } catch (error) {
        logger.error('Error retrieving customer details', error);
        result.errors.push(error.message);
    }
    return result;
}

/**
 * Lists all customers in the database
 * @param {object} conn - Database connection
 * @param {object} queryParams - Query parameters
 * @returns {object} - API result object
 */
async function listCustomers(conn, queryParams) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        const [rows] = await conn.execute('SELECT * FROM `customer`');
        result.status = 200;
        result.data = rows;
        logger.info('Customers listed successfully');
    } catch (error) {
        logger.error('Error listing customers', error);
        result.errors.push(error.message);
    }
    return result;
}

module.exports = {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerDetails,
    listCustomers,
};