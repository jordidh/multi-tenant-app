const express = require('express');
const router = express.Router();
const logger = require('../api/logger');
const tenantdb = require('../api/tenantdb');
const ApiResult = require('../api/ApiResult');
const ApiError = require('../api/ApiError');

router.get(('/'), async function (req, res, next) {
    const conn = await tenantdb.getPromisePool(999).getConnection();
    await conn.execute('set session transaction isolation level repeatable read');
    const isolationLevel = await conn.execute('SELECT @@transaction_isolation');
    logger.info(isolationLevel[0][0]['@@transaction_isolation']);

    await conn.beginTransaction();
    try {
        let sql = 'DELETE FROM register;';
        await conn.execute(sql);

        sql = 'DELETE FROM stock;';
        await conn.execute(sql);

        sql = 'DELETE FROM location;';
        await conn.execute(sql);

        sql = 'DELETE FROM unit;';
        await conn.execute(sql);

        sql = 'DELETE FROM product;';
        await conn.execute(sql);

        const insertUnit = await conn.execute(`INSERT INTO unit (id, code, description, base_unit) VALUES 
        (1, 'UNIT01', 'descripcio de prova1', 1), 
        (2, 'UNIT02', 'descripcio de prova', 10);`);
        if (insertUnit.length !== 2) {
            throw new Error('Couldn\'t insert values into db_test_insert.unit');
        }

        const insertProduct = await conn.execute(`INSERT INTO product (id, code, description) VALUES 
        (1, 'PRODUCT01', 'descripcio de prova');`);
        if (insertProduct.length !== 2) {
            throw new Error('Couldn\'t insert values into db_test_insert.product');
        }

        const insertLocation = await conn.execute(`INSERT INTO location (id, code, description) VALUES 
        (1, 'UBIC01', 'description 1'), 
        (2, 'UBIC02', 'description 2');`);
        if (insertLocation.length !== 2) {
            throw new Error('Couldn\'t insert values into db_test_insert.location');
        }

        const insertStock = await conn.execute(`INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES 
        (1, 55, 1, 1, 1), 
        (2, 17, 2, 1, 1);`);
        if (insertStock.length !== 2) {
            throw new Error('Couldn\'t insert values into db_test_insert.stock');
        }

        await conn.commit();
        res.status(200).json(new ApiResult(200, 'OK', 1, []));
    } catch (e) {
        logger.error('clean-db-test: Error cleaning database db_test_insert: ' + e);
        await conn.rollback();
        logger.info('clean-db-test: Transaction rolled back');
        const error = new ApiError('REG01', e.message, '', '');
        res.status(500).json(new ApiResult(500, 'Error cleaning database db_test_insert', 1, [error]));
    }
});

module.exports = router;
