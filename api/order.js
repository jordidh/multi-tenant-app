const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new order in the database
 * @param {object} conn - Database connection
 * @param {object} orderData - Order data
 * @returns {object} - API result object
 */
async function createOrder (conn, orderData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            'INSERT INTO `order` (order_type, customer_id, provider_id, order_date, due_date, status, warehouse_id_source, warehouse_id_destination, notes, comments, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderData.orderType, orderData.customer_id, orderData.provider_id, orderData.order_date, orderData.due_date, orderData.status, orderData.warehouse_id_source, orderData.warehouse_id_destination, orderData.notes, orderData.comments, orderData.version]
        );
        result.status = 201;
        result.data = { id: rows.insertId, ...orderData };
        await conn.commit();
        logger.info('order.createOrder(): Order created successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order.createOrder(): Error creating order: ' + error);
        result.errors.push({
            code: 'REG01',
            message: error.message,
            detail: '',
            help: ''
        });
    } finally {
        conn.release();
    }
    return result;
}

/**
 * Retrieves order details from the database
 * @param {object} conn - Database connection
 * @param {number} orderId - Order ID
 * @returns {object} - API result object
 */
async function getOrderDetails (conn, orderId) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT * FROM `order` WHERE id = ?', [orderId]);
        result.status = 200;
        result.data = rows[0];
        await conn.commit();
        logger.info('order.getOrderDetails(): Order details retrieved successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order.getOrderDetails(): Error retrieving order details: ' + error);
        result.errors.push({
            code: 'REG01',
            message: error.message,
            detail: '',
            help: ''
        });
    } finally {
        conn.release();
    }
    return result;
}

/**
 * Updates an existing order in the database
 * @param {object} conn - Database connection
 * @param {number} orderId - Order ID
 * @param {object} orderData - Updated order data
 * @returns {object} - API result object
 */
async function updateOrder (conn, orderId, orderData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        await conn.execute(
            'UPDATE `order` SET order_type = ?, customer_id = ?, provider_id = ?, order_date = ?, due_date = ?, status = ?, warehouse_id_source = ?, warehouse_id_destination = ?, notes = ?, comments = ?, version = ? WHERE id = ?',
            [orderData.orderType, orderData.customer_id, orderData.provider_id, orderData.order_date, orderData.due_date, orderData.status, orderData.warehouse_id_source, orderData.warehouse_id_destination, orderData.notes, orderData.comments, orderData.version, orderId]
        );
        result.status = 200;
        result.data = { id: orderId, ...orderData };
        await conn.commit();
        logger.info('order.updateOrder(): Order updated successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order.updateOrder(): Error updating order: ' + error);
        result.errors.push({
            code: 'REG01',
            message: error.message,
            detail: '',
            help: ''
        });
    } finally {
        conn.release();
    }
    return result;
}

/**
 * Deletes an order from the database
 * @param {object} conn - Database connection
 * @param {number} orderId - Order ID
 * @returns {object} - API result object
 */
async function deleteOrder (conn, orderId) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        await conn.execute('DELETE FROM `order` WHERE id = ?', [orderId]);
        result.status = 200;
        result.data = { id: orderId };
        await conn.commit();
        logger.info('order.deleteOrder(): Order deleted successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order.deleteOrder(): Error deleting order: ' + error);
        result.errors.push({
            code: 'REG01',
            message: error.message,
            detail: '',
            help: ''
        });
    } finally {
        conn.release();
    }
    return result;
}

/**
 * Lists all orders from the database
 * @param {object} conn - Database connection
 * @param {object} queryParams - Query parameters for filtering and pagination
 * @returns {object} - API result object
 */
async function listOrders (conn, queryParams) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT * FROM `order`');
        result.status = 200;
        result.data = rows;
        await conn.commit();
        logger.info('order.listOrders(): Orders listed successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order.listOrders(): Error listing orders: ' + error);
        result.errors.push({
            code: 'REG01',
            message: error.message,
            detail: '',
            help: ''
        });
    } finally {
        conn.release();
    }
    return result;
}

module.exports = {
    createOrder,
    getOrderDetails,
    updateOrder,
    deleteOrder,
    listOrders
};
