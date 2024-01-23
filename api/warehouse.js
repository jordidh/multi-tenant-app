const logger = require('./logger');

module.exports = {
    createLocation: async function (conn, location) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'INSERT INTO location (code, description) VALUES ( ?, ?);';
            const insertIntoLocation = await conn.execute(sql, [location.code, location.description]);
            if (insertIntoLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into location');
            }

            await conn.commit();
            logger.info('Insert into location: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    deleteLocation: async function (conn, location) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'DELETE FROM location WHERE id = ?;';
            const deleteLocation = await conn.execute(sql, [location.id]);
            if (deleteLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t delete the location');
            }

            await conn.commit();
            logger.info('Delete from location: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    modifyLocation: async function (conn, location, newLocation) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'UPDATE location SET code = ?, description = ? WHERE id = ?;';
            const modifyLocation = await conn.execute(sql, [newLocation.code, newLocation.description, location.id]);
            if (modifyLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t modify the location');
            }

            await conn.commit();
            logger.info('UPDATE from location: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    createStock: async function (conn, stock) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?);';
            const insertIntoStock = await conn.execute(sql, [stock.quantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (insertIntoStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }

            await conn.commit();
            logger.info('Insert into stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    deleteStock: async function (conn, stock) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'DELETE FROM stock WHERE id = ?;';
            const DeleteStock = await conn.execute(sql, [stock.id]);
            if (DeleteStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t delete the stock');
            }

            await conn.commit();
            logger.info('Delete from stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    modifyStock: async function (conn, stock, newStock) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'UPDATE stock SET quantity = ?, location_id = ?, product_id = ?, unit_id = ? WHERE id = ?;';
            const modidyStock = await conn.execute(sql,
                [newStock.quantity, newStock.location_id, newStock.product_id, newStock.unit_id, stock.id]);
            if (modidyStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t modify the stock');
            }

            await conn.commit();
            logger.info('UPDATE from stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    fusionStock: async function (conn, destStock, origStock) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            let sql = 'UPDATE stock SET quantity = quantity +' +
             ' (SELECT s.quantity FROM (SELECT quantity FROM stock FOR SHARE WHERE id = ?) s) WHERE id = ?;';
            const fusionStock = await conn.execute(sql, [origStock.id, destStock.id]);
            if (fusionStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t fusion the stock');
            }

            sql = 'DELETE FROM stock WHERE id = ?';
            const deleteStock = await conn.execute(sql, [origStock.id]);
            if (deleteStock[0].affectedRows !== 1) {
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

    divideStock: async function (conn, stock, newQuantity) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            let sql = `UPDATE stock SET quantity = quantity - ${newQuantity} WHERE id = ?;`;
            const fusionStock = await conn.execute(sql, [stock.id]);
            if (fusionStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t divide the stock');
            }

            sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?);';
            const insertIntoStock = await conn.execute(sql, [newQuantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (insertIntoStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }
            await conn.commit();
            logger.info('DIVIDE from stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error('Error dividing stock:', error);
            await conn.rollback();
            return false;
        }
    },

    groupStock: async function (conn, column) {
        let sql = '';
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            sql = `SELECT ${column}, SUM(quantity) AS total_quantity 
                    FROM stock 
                    GROUP BY ${column};`;
            const groupStock = await conn.execute(sql);
            if (groupStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t group the stock');
            }
            await conn.commit();
            logger.info('GRoup stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error('Error grouping stock:', error);
            await conn.rollback();
            return false;
        }
    },

    ungroupStock: async function (conn) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            const sql = 'SELECT * FROM stock';
            const groupStock = await conn.execute(sql);
            if (groupStock[0].length <= 0) {
                throw new Error('Couldn\'t ungroup the stock');
            }
            await conn.commit();
            logger.info('Ungroup stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error(error);
            await conn.rollback();
            return false;
        }
    },

    changeStockLocation: async function (conn, origStock, newLocation, quantity) {
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            let sql = `UPDATE stock SET quantity = quantity - ${quantity} WHERE id = ?;`;
            const fusionStock = await conn.execute(sql, [origStock.id]);
            if (fusionStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t divide the stock');
            }

            sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?);';
            const insertIntoStock = await conn.execute(sql, [quantity, newLocation.id, origStock.product_id, origStock.unit_id]);
            if (insertIntoStock[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }
            await conn.commit();
            logger.info('Change stock location: Transaction committed');
            return true;
        } catch (error) {
            logger.error('Error changing stock location:', error);
            await conn.rollback();
            return false;
        }
    },

    countLocationStock: async function (conn, location) {
        let sql = '';
        await conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await conn.beginTransaction();
        try {
            sql = 'SELECT SUM(quantity) AS total_quantity FROM stock WHERE location_id = ? GROUP BY location_id;';
            const groupStock = await conn.execute(sql, [location.id]);
            if (groupStock[0].length !== 1) {
                throw new Error('Couldn\'t group the stock');
            }
            await conn.commit();
            logger.info('Count location stock: Transaction committed');
            return true;
        } catch (error) {
            logger.error('Error counting location stock:', error);
            await conn.rollback();
            return false;
        }
    }
};
