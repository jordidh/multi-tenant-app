const express = require('express');
const router = express.Router();
const logger = require('../api/logger');
const warehouse = require('../api/warehouse');
const tenantdb = require('../api/tenantdb');

router.get('/', function (req, res, next) {
});

router.post('/location', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const result = await await warehouse.createLocation(conn, req.body);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.delete('/location', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const result = await warehouse.deleteLocation(conn, req.body);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.put('/location', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql = 'SELECT version from location where id = ?';
    const version = await conn.execute(sql, [req.body.id]);
    req.body.version = version[0][0].version;

    const result = await warehouse.updateLocation(conn, req.body);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.post('/stock', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const result = await warehouse.createStock(conn, req.body);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.delete('/stock', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const result = await warehouse.deleteStock(conn, req.body);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.put('/stock', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql = 'SELECT version from stock where id = ?';
    const version = await conn.execute(sql, [req.body.id]);
    req.body.version = version[0][0].version;

    const result = await warehouse.updateStock(conn, req.body);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.post('/stock/fusion', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql = 'SELECT version from stock where id = ?';
    const version = await conn.execute(sql, [req.body[0].id]);
    req.body[0].version = version[0][0].version;

    const result = await warehouse.fusionStock(conn, req.body[0], req.body[1]);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.post('/stock/divide', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql = 'SELECT version from stock where id = ?';
    const version = await conn.execute(sql, [req.body[0].id]);
    req.body[0].version = version[0][0].version;

    const result = await warehouse.divideStock(conn, req.body[0], req.body[1].quantity);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.post('/stock/group', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    let sql = 'SELECT version from stock where id = ?';
    let version = await conn.execute(sql, [req.body[0].id]);
    req.body[0].version = version[0][0].version;

    sql = 'SELECT quantity from stock where id = ?';
    version = await conn.execute(sql, [req.body[0].id]);
    req.body[0].quantity = version[0][0].quantity;

    sql = 'SELECT version from unit where id = ?';
    version = await conn.execute(sql, [req.body[1].id]);
    req.body[1].version = version[0][0].version;

    const result = await warehouse.groupStock(conn, req.body[0], req.body[1]);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.post('/stock/ungroup', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    let sql = 'SELECT version from stock where id = ?';
    let version = await conn.execute(sql, [req.body[0].id]);
    req.body[0].version = version[0][0].version;

    sql = 'SELECT quantity from stock where id = ?';
    version = await conn.execute(sql, [req.body[0].id]);
    req.body[0].quantity = version[0][0].quantity;

    sql = 'SELECT version from unit where id = ?';
    version = await conn.execute(sql, [req.body[1].id]);
    req.body[1].version = version[0][0].version;

    const result = await warehouse.ungroupStock(conn, req.body[0], req.body[1]);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.post('/stock/change-location', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const sql = 'SELECT version from stock where id = ?';
    const stock = await conn.execute(sql, [req.body[0].id]);
    req.body[0].version = stock[0][0].version;

    const result = await warehouse.changeLocationStock(conn, req.body[0], req.body[1]);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

router.get('/stock/count-location', async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(1).getConnection();

    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    const result = await warehouse.countLocationStock(conn, req.query);
    if (result.errors.length === 0) {
        logger.info(result.data.message);
    }
    conn.release();
    res.render('index', { title: 'nu+warehouses' });
});

module.exports = router;
