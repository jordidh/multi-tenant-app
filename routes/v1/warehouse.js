const express = require('express');
const router = express.Router();
const logger = require('../../api/logger');
const warehouse = require('../../api/warehouse');
const tenantdb = require('../../api/tenantdb');

router.delete(('/'), async function (req, res, next) {
    const id = parseInt(req.query.id, 10);
    const conn = await tenantdb.getPromisePool(id).getConnection();
    const sql = 'DELETE FROM register;';
    const sql1 = 'DELETE FROM STOCK;';
    await conn.execute(sql);
    await conn.execute(sql1);
    res.status(200).json();
});

/**
 * @swagger
 * definitions:
 *   schemas:
 *     Location:
 *       tags:
 *         - Location
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: the location code, must be unique
 *           example: LOC01
 *         description:
 *           type: string
 *           description: the location description
 *           example: new location
 *       required: ['code']
 */

/**
 * @swagger
 * definitions:
 *   schemas:
 *     Stock:
 *       tags:
 *         - Stock
 *       type: object
 *       properties:
 *         quantity:
 *           type: integer
 *           description: the location code, must be unique
 *           example: 5
 *         location_id:
 *           type: integer
 *           description: the location id
 *           example: 1
 *         product_id:
 *           type: integer
 *           description: the location description
 *           example: 1
 *         unit_id:
 *           type: integer
 *           description: the location description
 *           example: 1
 *       required: ['quantity', 'location_id', 'product_id', 'unit_id']
 */

/**
 * @swagger
 * /warehouse/location:
 *   get:
 *     tags:
 *       - Location
 *     summary: Returns locations
 *     description: Returns all the locations with limits
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: filter
 *         description: Filter the locations by 'property:rule:value'. Rules=>
 *           EQUALS='eq', NOT_EQUALS='neq', GREATER_THAN='gt', GREATER_THAN_OR_EQUALS='gte', LESS_THAN='lt', LESS_THAN_OR_EQUALS='lte',
 *           LIKE='like', NOT_LIKE='nlike', IN='in', NOT_IN='nin', IS_NULL='isnull', IS_NOT_NULL='isnotnull'.
 *           (Don't forget the comma between two diferent filter).
 *         example: version:lt:5
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: sort
 *         description: Sort the locations by 'property:order'. (Don't forget the comma between two diferent sort).
 *         example: version:ASC
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: skip
 *         description: Number of locations to skip
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: limit
 *         description: Max. number of elements to return
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with all locations found in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               $ref: '#/definitions/ApiResult'
 */

router.get('/location', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Obtener la ID del tenant propietario de la db
    const conn = await tenantdb.getPromisePool(id).getConnection();
    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.getLocations(conn, req.query);
    if (ApiResult.errors.length === 0) {
        logger.info('Location read successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/location/{id}:
 *   get:
 *     tags:
 *       - Location
 *     summary: get a location
 *     description: Get the location information using it's id.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Use the location ID to perform a search
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         nom: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.get('/location/:id', async function (req, res, next) {
    console.log(req.query);
    const id = parseInt(req.query.id, 10); // Obtener la ID del tenant propietario de la db
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.getLocation(conn, req.params);
    if (ApiResult.errors.length === 0) {
        logger.info('Location read successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/location:
 *   post:
 *     tags:
 *       - Location
 *     summary: add location
 *     description: Creates a new location.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/schemas/Location'
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       201:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/location', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await await warehouse.createLocation(conn, req.body);
    if (ApiResult.errors.length === 0) {
        logger.info('Location created successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/location/{id}:
 *   put:
 *     tags:
 *       - Location
 *     summary: update location
 *     description: Updates the location that matches with the id using the values of the object below.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Use the location ID to perform a search
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         nom: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/schemas/Location'
 *     responses:
 *       200:
 *         description: update location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: object
 *                   items:
 *                     type: object
 */

router.put('/location/:id', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);
    logger.info(req.body.code);
    const ApiResult = await warehouse.updateLocation(conn, req.params.id, req.body);
    if (ApiResult.errors.length === 0) {
        logger.info('Location updated successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/location/{id}:
 *   delete:
 *     tags:
 *       - Location
 *     summary: delete location
 *     description: Deletes the location with the id inserted. Must not be referenced in any stock.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Use the stock ID to perform a search
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         nom: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: delete location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: object
 *                   items:
 *                     type: object
 */

router.delete('/location/:id', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.deleteLocation(conn, req.params);
    if (ApiResult.errors.length === 0) {
        logger.info('Location deleted successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @swagger
 * /warehouse/stock:
 *   get:
 *     tags:
 *       - Stock
 *     summary: Returns stocks
 *     description: Returns all the stocks with limits
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: filter
 *         description: Filter the stocks by 'property:rule:value'. Rules=>
 *           EQUALS='eq', NOT_EQUALS='neq', GREATER_THAN='gt', GREATER_THAN_OR_EQUALS='gte', LESS_THAN='lt', LESS_THAN_OR_EQUALS='lte',
 *           LIKE='like', NOT_LIKE='nlike', IN='in', NOT_IN='nin', IS_NULL='isnull', IS_NOT_NULL='isnotnull'.
 *           (Don't forget the comma between two diferent filter).
 *         example: quantity:gt:5
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: sort
 *         description: Sort the stocks by 'property:order'. (Don't forget the comma between two diferent sort).
 *         example: quantity:ASC
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: skip
 *         description: Number of stocks to skip
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: limit
 *         description: Max. number of elements to return
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with all stocks found in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               $ref: '#/definitions/ApiResult'
 */

router.get('/stock', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.getStocks(conn, req.query);
    console.log(res.body);
    if (ApiResult.errors.length === 0) {
        logger.info('Stocks read successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/{id}:
 *   get:
 *     tags:
 *       - Stock
 *     summary: get a stock
 *     description: Get the stock information using it's id.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Use the stock ID to perform a search
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.get('/stock/:id', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.getStock(conn, req.params);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock read successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock:
 *   post:
 *     tags:
 *       - Stock
 *     summary: add stock
 *     description: Creates a new stock.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/schemas/Stock'
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       201:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/stock', async function (req, res, next) {
    console.log(req.body);
    console.log(req.query);
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.createStock(conn, req.body);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock created successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/{id}:
 *   put:
 *     tags:
 *       - Stock
 *     summary: update location
 *     description: Updates the stock replacing it's values with the ones inserted (except id and version).
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Use the stock ID to perform a search
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID of the tenant owner of the warehouse db
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/schemas/Stock'
 *     responses:
 *       200:
 *         description: update stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: object
 *                   items:
 *                     type: object
 */

router.put('/stock/:id', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);
    logger.info(req.body.location_id);
    const ApiResult = await warehouse.updateStock(conn, req.params.id, req.body);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock updated successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock:
 *   delete:
 *     tags:
 *       - Stock
 *     summary: Eliminar stock
 *     description: Elimina el stock con la ID proporcionada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:  # Utiliza allOf para combinar la referencia y añadir propiedades adicionales
 *               - $ref: '#/definitions/schemas/Stock'  # Referencia al esquema de Stock
 *               - type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 2
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: Stock eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: object
 *                   items:
 *                     type: object
 */

router.delete('/stock', async function (req, res, next) {
    console.log(req.body);
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.deleteStock(conn, req.body);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock deleted successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/fusion:
 *   post:
 *     tags:
 *       - Stock
 *     summary: fusion stocks
 *     description: Fusion the two stocks into the first one and deletes the second stock.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *           example:
 *             - id: 1
 *               quantity: 55
 *               location_id: 1
 *               product_id: 1
 *               unit_id: 1
 *               version: 0
 *             - id: 3
 *               quantity: 35
 *               location_id: 1
 *               product_id: 1
 *               unit_id: 1
 *               version: 0
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/stock/fusion', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.fusionStock(conn, req.body[0], req.body[1]);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock merged successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/divide:
 *   post:
 *     tags:
 *       - Stock
 *     summary: divides stock
 *     description: Divides the stock and creates a new stock with a quantity equal to the one inserted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *           example:
 *             - id: 1
 *               quantity: 55
 *               location_id: 1
 *               product_id: 1
 *               unit_id: 1
 *               version: 0
 *             - quantity: 20
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/stock/divide', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.divideStock(conn, req.body[0], req.body[1].quantity);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock divided successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/group:
 *   post:
 *     tags:
 *       - Stock
 *     summary: groups a stock
 *     description: Groups the stock into one with higher base_unit.
 *       The data of the second object of the array, corresponds to the unit which you want to change the stock. The response shows the initial stock after being grouped and the stock with a higher base_unit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *           example:
 *             - id: 1
 *               quantity: 55
 *               location_id: 1
 *               product_id: 1
 *               unit_id: 1
 *               version: 0
 *             - id: 2
 *               base_unit: 10
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/stock/group', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql1 = 'SELECT * FROM stock where id = ?';
    const resultQuery = await conn.execute(sql1, [req.body[0].id]);
    if (resultQuery[0].length === 0) {
        throw new Error('The Stock does not exist.');
    }
    req.body[0].version = resultQuery[0][0].version;
    req.body[0].quantity = resultQuery[0][0].quantity;

    const ApiResult = await warehouse.groupStock(conn, req.body[0], req.body[1]);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock grouped successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/ungroup:
 *   post:
 *     tags:
 *       - Stock
 *     summary: ungroups a stock
 *     description: Ungroups the stock into one with lower base_unit.
 *       The data of the second object of the array, corresponds to the unit which you want to change the stock.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *           example:
 *             - id: 2
 *               quantity: 5
 *               location_id: 1
 *               product_id: 1
 *               unit_id: 2
 *               version: 0
 *             - id: 1
 *               base_unit: 1
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/stock/ungroup', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql1 = 'SELECT * FROM stock where id = ?';
    const resultQuery = await conn.execute(sql1, [req.body[0].id]);
    if (resultQuery[0].length === 0) {
        throw new Error('The Stock does not exist.');
    }
    req.body[0].version = resultQuery[0][0].version;
    req.body[0].quantity = resultQuery[0][0].quantity;

    const ApiResult = await warehouse.ungroupStock(conn, req.body[0], req.body[1]);
    if (ApiResult.errors.length === 0) {
        logger.info('Stock ungrouped successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/change-location:
 *   post:
 *     tags:
 *       - Stock
 *     summary: Changes the location of a stock.
 *     description: The first object is a stock and the second is it's new location.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *           example:
 *             - id: 2
 *               quantity: 17
 *               location_id: 2
 *               product_id: 1
 *               unit_id: 2
 *               version: 0
 *             - id: 1
 *               code: "LOC01"
 *               description: "Location 1"
 *               version: 0
 *     parameters:
 *       - in: query
 *         name: id   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.post('/stock/change-location', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql = 'SELECT version from stock where id = ?';
    const stock = await conn.execute(sql, [req.body[0].id]);
    req.body[0].version = stock[0][0].version;

    const ApiResult = await warehouse.changeLocationStock(conn, req.body[0], req.body[1]);
    if (ApiResult.errors.length === 0) {
        logger.info('Location stock changed successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

/**
 * @openapi
 * /warehouse/stock/count-location/{id}:
 *   get:
 *     tags:
 *       - Stock
 *     summary: Counts the amount of a stock of a location
 *     description: Counts the amount of a stock of a location using group by location_id.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Use the location ID to perform a search
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: id_tenant   # Nuevo parámetro de consulta para la ID
 *         description: ID del propietario del almacén en la base de datos
 *         example: 999
 *         schema:
 *           type: integer
 *         required: true  # Indica si el parámetro es obligatorio
 *     responses:
 *       200:
 *         description: ApiResult object with created container in data attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/definitions/ApiResult'
 */

router.get('/stock/count-location/:id', async function (req, res, next) {
    const id = parseInt(req.query.id, 10); // Para seleccionar la base de datos correcta
    const conn = await tenantdb.getPromisePool(id).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const ApiResult = await warehouse.countLocationStock(conn, req.params);
    if (ApiResult.errors.length === 0) {
        logger.info('Location stock counted successfully');
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    } else {
        conn.release();
        res.status(ApiResult.status).json(ApiResult);
    }
});

module.exports = router;
