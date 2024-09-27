const express = require('express');
const router = express.Router();
const logger = require('../../api/logger');
const customers = require('../../api/customer');
const tenantdb = require('../../api/tenantdb');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API for managing customers
 */

/**
 * @swagger
 * /customer:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
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
 *             example: { "name": "John Doe", "email": "john@example.com", "phone": "123456789", "address_id": 1 }
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await customers.createCustomer(conn, req.body);

        if (ApiResult.errors.length === 0) {
            logger.info('Customer created successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error creating customer', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in POST /customer', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /customer/{customerId}:
 *   put:
 *     summary: Update an existing customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
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
 *             example: { "name": "John Doe", "email": "john@example.com", "phone": "123456789", "address_id": 1 }
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       500:
 *         description: Internal server error
 */
router.put('/:customerId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await customers.updateCustomer(conn, req.params.customerId, req.body);

        if (ApiResult.errors.length === 0) {
            logger.info('Customer updated successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error updating customer', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in PUT /customer/:customerId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /customer/{customerId}:
 *   get:
 *     summary: Get customer details
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:customerId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await customers.getCustomerDetails(conn, req.params.customerId);

        if (ApiResult.errors.length === 0) {
            logger.info('Customer details retrieved successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error retrieving customer details', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in GET /customer/:customerId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /customer/{customerId}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete('/:customerId', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await customers.deleteCustomer(conn, req.params.customerId);

        if (ApiResult.errors.length === 0) {
            logger.info('Customer deleted successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error deleting customer', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in DELETE /customer/:customerId', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /customer:
 *   get:
 *     summary: List all customers
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Customers listed successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    try {
        const id = parseInt(req.query.id, 10);
        const conn = await tenantdb.getPromisePool(id).getConnection();
        const ApiResult = await customers.listCustomers(conn, req.query);
        ApiResult.requestId = req.requestId;

        if (ApiResult.errors.length === 0) {
            logger.info('Customers listed successfully');
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        } else {
            logger.error('Error listing customers', ApiResult.errors);
            conn.release();
            res.status(ApiResult.status).json(ApiResult);
        }
    } catch (error) {
        logger.error('Error in GET /customer', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;