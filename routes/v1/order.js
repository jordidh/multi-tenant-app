const express = require('express');
const router = express.Router();
const logger = require('../../api/logger');
const orders = require('../../api/order');
const tenantdb = require('../../api/tenantdb');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API for managing orders
 */

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: { "orderId": "12345", "product": "Example Product", "quantity": 1 }
 *     responses:
 *       201:
 *         description: Order created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    try {
        console.log(req.query);
        console.log(req.params);
        const id = parseInt(req.query.id, 10);
        console.log('Tenant ID:', id);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orders.createOrder(conn, req.body);

        if (ApiResult.errors.length === 0) {
            logger.info('Order created successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error creating order', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in POST /order', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order/{orderId}:
 *   put:
 *     summary: Update an existing order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: { "product": "Updated Product", "quantity": 2 }
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       500:
 *         description: Internal server error
 */
router.put('/:orderId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orders.updateOrder(conn, req.params.orderId, req.body);

        if (ApiResult.errors.length === 0) {
            logger.info('Order updated successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error updating order', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in PUT /order/:orderId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:orderId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orders.getOrderDetails(conn, req.params.orderId);

        if (ApiResult.errors.length === 0) {
            logger.info('Order details retrieved successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error retrieving order details', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in GET /order/:orderId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order/{orderId}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete('/:orderId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orders.deleteOrder(conn, req.params.orderId);

        if (ApiResult.errors.length === 0) {
            logger.info('Order deleted successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error deleting order', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in DELETE /order/:orderId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order:
 *   get:
 *     summary: List all orders
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Orders listed successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orders.listOrders(conn, req.query);
        ApiResult.requestId = req.requestId;

        if (ApiResult.errors.length === 0) {
            logger.info('Orders listed successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error listing orders', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in GET /order', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
