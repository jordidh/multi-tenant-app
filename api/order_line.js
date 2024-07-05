const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new order line in the database
 * @param {object} conn - Database connection
 * @param {object} orderLineData - Order line data
 * @returns {object} - API result object
 */
async function createOrderLine (conn, orderLineData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        logger.info(`createOrderLine called with data: ${JSON.stringify(orderLineData)}`);

        const orderId = orderLineData.order_id || null;
        const productId = orderLineData.product_id || null;
        const quantity = orderLineData.quantity || null;
        const unitId = orderLineData.unit_id !== undefined ? orderLineData.unit_id : 1;
        const price = orderLineData.price || null;

        logger.info(`order_id: ${orderId}`);
        logger.info(`product_id: ${productId}`);
        logger.info(`quantity: ${quantity}`);
        logger.info(`unit_id: ${unitId}`);
        logger.info(`price: ${price}`);

        await conn.beginTransaction();

        const [productRows] = await conn.execute(
            'SELECT id FROM `product` WHERE id = ?',
            [productId]
        );
        if (productRows.length === 0) {
            throw new Error(`Product with id ${productId} does not exist`);
        }

        const [rows] = await conn.execute(
            'INSERT INTO `order_line` (order_id, product_id, quantity, unit_id, price) VALUES (?, ?, ?, ?, ?)',
            [orderId, productId, quantity, unitId, price]
        );
        result.status = 201;
        result.data = { id: rows.insertId, ...orderLineData };
        await conn.commit();
        logger.info('order_line.createOrderLine(): Order line created successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order_line.createOrderLine(): Error creating order line: ' + error);
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
 * Retrieves order line details from the database
 * @param {object} conn - Database connection
 * @param {number} orderLineId - Order line ID
 * @returns {object} - API result object
 */
async function getOrderLineDetails (conn, orderLineId) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT * FROM `order_line` WHERE id = ?', [orderLineId]);
        result.status = 200;
        result.data = rows[0];
        await conn.commit();
        logger.info('order_line.getOrderLineDetails(): Order line details retrieved successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order_line.getOrderLineDetails(): Error retrieving order line details: ' + error);
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
 * Updates an existing order line in the database
 * @param {object} conn - Database connection
 * @param {number} orderLineId - Order line ID
 * @param {object} orderLineData - Updated order line data
 * @returns {object} - API result object
 */
async function updateOrderLine (conn, orderLineId, orderLineData) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        logger.info(`updateOrderLine called with data: ${JSON.stringify(orderLineData)}`);

        const orderId = orderLineData.order_id !== undefined ? orderLineData.order_id : null;
        const productId = orderLineData.product_id !== undefined ? orderLineData.product_id : null;
        const quantity = orderLineData.quantity !== undefined ? orderLineData.quantity : null;
        const unitId = orderLineData.unit_id !== undefined ? orderLineData.unit_id : null;
        const price = orderLineData.price !== undefined ? orderLineData.price : null;

        logger.info(`order_id: ${orderId}`);
        logger.info(`product_id: ${productId}`);
        logger.info(`quantity: ${quantity}`);
        logger.info(`unit_id: ${unitId}`);
        logger.info(`price: ${price}`);

        if (orderId === null || productId === null || quantity === null || unitId === null || price === null) {
            throw new Error('All parameters must be provided and cannot be null or undefined');
        }

        await conn.beginTransaction();

        const [productRows] = await conn.execute(
            'SELECT id FROM `product` WHERE id = ?',
            [productId]
        );
        if (productRows.length === 0) {
            throw new Error(`Product with id ${productId} does not exist`);
        }

        await conn.execute(
            'UPDATE `order_line` SET order_id = ?, product_id = ?, quantity = ?, unit_id = ?, price = ? WHERE id = ?',
            [orderId, productId, quantity, unitId, price, orderLineId]
        );
        result.status = 200;
        result.data = { id: orderLineId, ...orderLineData };
        await conn.commit();
        logger.info('order_line.updateOrderLine(): Order line updated successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order_line.updateOrderLine(): Error updating order line: ' + error);
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
 * Deletes an order line from the database
 * @param {object} conn - Database connection
 * @param {number} orderLineId - Order line ID
 * @returns {object} - API result object
 */
async function deleteOrderLine (conn, orderLineId) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        await conn.execute('DELETE FROM `order_line` WHERE id = ?', [orderLineId]);
        result.status = 200;
        result.data = { id: orderLineId };
        await conn.commit();
        logger.info('order_line.deleteOrderLine(): Order line deleted successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order_line.deleteOrderLine(): Error deleting order line: ' + error);
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
 * Lists all order lines from the database
 * @param {object} conn - Database connection
 * @param {object} queryParams - Query parameters for filtering and pagination
 * @returns {object} - API result object
 */
async function listOrderLines (conn, queryParams) {
    const result = { status: 500, errors: [], requestId: uuidv4() };
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT * FROM `order_line`');
        result.status = 200;
        result.data = rows;
        await conn.commit();
        logger.info('order_line.listOrderLines(): Order lines listed successfully');
    } catch (error) {
        await conn.rollback();
        logger.error('order_line.listOrderLines(): Error listing order lines: ' + error);
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
    createOrderLine,
    getOrderLineDetails,
    updateOrderLine,
    deleteOrderLine,
    listOrderLines
};
