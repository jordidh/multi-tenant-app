const logger = require('./logger');
require('dotenv').config();
const mysql = require('mysql2/promise');

async function getDatabaseConnection () {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'db_user_1'
    });
}

module.exports = {
    createLocation: async function (conn, location) {
        let sql = '';
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'INSERT INTO location (code, description) VALUES ( ?, ?);';
            const insertIntoLocation = await conn.execute(sql, [location.code, location.description]);

            if (insertIntoLocation.length !== 2 || insertIntoLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into location');
            }

            await conn.commit();
            logger.info('Insert into location: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error creating new location:', error);
            await conn.rollback();
            return false;
        }
    },

    deleteLocation: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'DELETE FROM location WHERE id = ?;';
            const locationId = 6;
            const deleteLocation = await conn.execute(sql, [locationId]);

            if (deleteLocation.length !== 2 || deleteLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t delete the location');
            }

            await conn.commit();
            logger.info('Delete from location: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error deleting location:', error);
            await conn.rollback();
            return false;
        }
    },

    modifyLocation: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'UPDATE location SET code = ?, description = ? WHERE id = 5;';
            const newCode = 'BBB';
            const newDescription = 'This is new';
            const modifyLocation = await conn.execute(sql, [newCode, newDescription]);

            if (modifyLocation.length !== 2 || modifyLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t modify the location');
            }

            await conn.commit();
            logger.info('UPDATE from location: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error modifying location:', error);
            await conn.rollback();
            return false;
        }
    },

    createStock: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (3, 6, 1, 1);';
            const insertIntoStock = await conn.execute(sql);

            if (insertIntoStock.length !== 2 || insertIntoStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }

            await conn.commit();
            logger.info('Insert into stock: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error creating new stock:', error);
            await conn.rollback();
            return false;
        }
    },

    deleteStock: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'DELETE FROM stock WHERE id = ?;';
            const locationId = 2;
            const DeleteStock = await conn.execute(sql, [locationId]);

            if (DeleteStock.length !== 2 || DeleteStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t delete the stock');
            }

            await conn.commit();
            logger.info('Delete from stock: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error deleting stock:', error);
            await conn.rollback();
            return false;
        }
    },

    modifyStock: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'UPDATE stock SET quantity = ? location_id = ? WHERE id = 2;';
            const newQuantity = 4;
            const newLocation = 6;
            const modidyStock = await conn.execute(sql, [newQuantity, newLocation]);

            if (modidyStock.length !== 2 || modidyStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t modify the stock');
            }

            await conn.commit();
            logger.info('UPDATE from stock: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error modifying stock:', error);
            await conn.rollback();
            return false;
        }
    },

    fusionStock: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = 'UPDATE stock SET quantity = quantity + (SELECT quantity FROM stock WHERE id = 2) WHERE id = 1;';
            const fusionStock = await conn.execute(sql);
            if (fusionStock.length !== 2 || fusionStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t fusion the stock');
            }

            sql = 'DELETE FROM stock WHERE id =2';
            const deleteStock = await conn.execute(sql);
            if (deleteStock.length !== 2 || deleteStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t delete the stock');
            }

            await conn.commit();
            logger.info('FUSION from stock: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error fusion stock:', error);
            await conn.rollback();
            return false;
        }
    },

    groupStock: async function () {
        let sql = '';
        const conn = await getDatabaseConnection();
        await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await conn.beginTransaction();

        try {
            sql = `SELECT location_id, product_id, unit_id, SUM(quantity) AS total_quantity 
                    FROM stock 
                    GROUP BY location_id, product_id, unit_id;`;
            const groupStock = await conn.execute(sql);
            if (groupStock.length !== 2 || groupStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t group the stock');
            }

            await conn.commit();
            logger.info('SELECT and GROUP from stock: Transaction committed');

            return true;
        } catch (error) {
            logger.error('Error SELECT and GROUP stock:', error);
            await conn.rollback();
            return false;
        }
    }

};
