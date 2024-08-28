const express = require('express');
const router = express.Router();
const logger = require('../../api/logger');
const orderLines = require('../../api/order_line');
const tenantdb = require('../../api/tenantdb');

/**
 * @swagger
 * tags:
 *   name: OrderLines
 *   description: API for managing order lines
 */

/**
 * @swagger
 * /order_line:
 *   post:
 *     summary: Create a new order line
 *     tags: [OrderLines]
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
 *             example: { "order_id": 1, "product_id": 123, "quantity": 10, "price": 99.99 }
 *     responses:
 *       201:
 *         description: Order line created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orderLines.createOrderLine(conn, req.body);

        if (ApiResult.errors.length === 0) {
            logger.info('Order line created successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error creating order line', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in POST /order_line', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order_line/{orderLineId}:
 *   get:
 *     summary: Get order line details
 *     tags: [OrderLines]
 *     parameters:
 *       - in: path
 *         name: orderLineId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order Line ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Order line details retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:orderLineId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orderLines.getOrderLineDetails(conn, req.params.orderLineId);

        if (ApiResult.errors.length === 0) {
            logger.info('Order line details retrieved successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error retrieving order line details', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in GET /order_line/:orderLineId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order_line/{orderLineId}:
 *   put:
 *     summary: Update an existing order line
 *     tags: [OrderLines]
 *     parameters:
 *       - in: path
 *         name: orderLineId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order Line ID
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
 *             properties:
 *               order_id:
 *                 type: integer
 *                 example: 1
 *               product_id:
 *                 type: integer
 *                 example: 123
 *               quantity:
 *                 type: integer
 *                 example: 10
 *               unit_id:
 *                 type: integer
 *                 example: 1
 *               price:
 *                 type: number
 *                 example: 99.99
 *     responses:
 *       200:
 *         description: Order line updated successfully
 *       500:
 *         description: Internal server error
 */
router.put('/:orderLineId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orderLines.updateOrderLine(conn, req.params.orderLineId, req.body);

        if (ApiResult.errors.length === 0) {
            logger.info('Order line updated successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error updating order line', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in PUT /order_line/:orderLineId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order_line/{orderLineId}:
 *   delete:
 *     summary: Delete an order line
 *     tags: [OrderLines]
 *     parameters:
 *       - in: path
 *         name: orderLineId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order Line ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Order line deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete('/:orderLineId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orderLines.deleteOrderLine(conn, req.params.orderLineId);

        if (ApiResult.errors.length === 0) {
            logger.info('Order line deleted successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error deleting order line', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in DELETE /order_line/:orderLineId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /order_line:
 *   get:
 *     summary: List all order lines
 *     tags: [OrderLines]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Order lines listed successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await orderLines.listOrderLines(conn, req.query);

        if (ApiResult.errors.length === 0) {
            logger.info('Order lines listed successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error listing order lines', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in GET /order_line', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
