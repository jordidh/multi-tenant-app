const logger = require('./logger');
const ApiResult = require('./ApiResult');
const ApiError = require('./ApiError');

module.exports = {
    createLocation: async function (conn, location) {
        await conn.beginTransaction();
        try {
            const sql = 'INSERT INTO location (code, description) VALUES ( ?, ?);';
            const insertIntoLocation = await conn.execute(sql, [location.code, location.description]);
            if (insertIntoLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into location');
            }

            await conn.commit();
            logger.info('warehouse.createLocation(): Transaction committed');
            return new ApiResult(200, { message: 'Location created successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.createLocation(): Error creating location: ' + e);
            await conn.rollback();
            logger.info('warehouse.createLocation(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error creating location', 1, [error]);
        }
    },

    /**
     * DELETE statement locks the row deleted.
     */
    deleteLocation: async function (conn, location) {
        await conn.beginTransaction();
        try {
            const sql = 'DELETE FROM location WHERE id = ?;';
            const deleteLocation = await conn.execute(sql, [location.id]);
            if (deleteLocation[0].affectedRows !== 1) {
                throw new Error('The location does not exist.');
            }

            await conn.commit();
            logger.info('warehouse.deleteLocation(): Transaction committed');
            return new ApiResult(200, { message: 'Location deleted successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.deleteLocation(): Error deleting location: ' + e);
            await conn.rollback();
            logger.info('warehouse.deleteLocation(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error deleting location', 1, [error]);
        }
    },

    /**
     * Modifies the values of the location parameter.
     * UPDATE statement locks the row updated.
     */
    updateLocation: async function (conn, location) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, location.id);

            const sql = 'UPDATE location SET code = ?, description = ?, version = version + 1 WHERE id = ? AND version = ?';
            const modifyLocation = await conn.execute(sql, [location.code, location.description, location.id, location.version]);
            if (modifyLocation[0].affectedRows !== 1) {
                throw new Error('The version does not match with the location.');
            }

            await conn.commit();
            logger.info('warehouse.updateLocation(): Transaction committed');
            return new ApiResult(200, { message: 'Location updated successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.updateLocation(): Error updating location: ' + e);
            await conn.rollback();
            logger.info('warehouse.updateLocation(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error updating location', 1, [error]);
        }
    },

    /**
     * Creates a new stock
     */
    createStock: async function (conn, stock) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, stock.location_id);

            let sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?);';
            let resultQuery = await conn.execute(sql, [stock.quantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }

            sql = 'SELECT id FROM stock WHERE quantity = ? AND location_id = ? AND product_id = ? AND unit_id = ?';
            resultQuery = await conn.execute(sql, [stock.quantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (resultQuery[0].length !== 1) {
                throw new Error('Couldn\'t find the stock');
            }
            await registerOperation(conn, resultQuery[0][0].id, 'createStock');

            await conn.commit();
            logger.info('warehouse.createStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock created successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.createStock(): Error creating Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.createStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error creating Stock', 1, [error]);
        }
    },

    /**
     * Deletes the stock.
     * DELETE statement locks the row deleted.
     */
    deleteStock: async function (conn, stock) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, stock.location_id);

            const sql = 'DELETE FROM stock WHERE id = ?;';
            const deleteStock = await conn.execute(sql, [stock.id]);
            if (deleteStock[0].affectedRows !== 1) {
                throw new Error('The stock does not exist');
            }

            await registerOperation(conn, stock.id, 'deleteStock');

            await conn.commit();
            logger.info('warehouse.deleteStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock deleted successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.deleteStock(): Error deleting Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.deleteStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error deleting Stock', 1, [error]);
        }
    },

    /**
     * Updates the stock.
     * UPDATE statement locks the row updated.
     */
    updateStock: async function (conn, stock) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, stock.location_id);
            await checkStock(conn, stock.id);

            const sql = 'UPDATE stock SET quantity = ?, location_id = ?, product_id = ?, unit_id = ?, version = version + 1 WHERE id = ? AND version = ?';
            const resultQuery = await conn.execute(sql, [stock.quantity, stock.location_id, stock.product_id, stock.unit_id, stock.id, stock.version]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('The version does not match with the stock.');
            }
            await registerOperation(conn, stock.id, 'updateStock');

            await conn.commit();
            logger.info('warehouse.updateStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock updated successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.updateStock(): Error updating Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.updateStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error updating Stock', 1, [error]);
        }
    },

    /**
     * Fusion the two stocks into one and deletes the other.
     * @param {*} resultStock: the final destiny of the stock.
     * @param {*} deleteStock: the stock that will be fusioned (quantity) and then deleted.
     */
    fusionStock: async function (conn, resultStock, deleteStock) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, resultStock.location_id);
            await checkStock(conn, deleteStock.id);

            let sql = 'UPDATE stock SET quantity = quantity + ?, version = version + 1 WHERE id = ? AND version = ?';
            let resultQuery = await conn.execute(sql, [deleteStock.quantity, resultStock.id, resultStock.version]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('The version does not match with the stock.');
            }
            await registerOperation(conn, resultStock.id, 'fusionStock');

            sql = 'DELETE FROM stock WHERE id = ?';
            resultQuery = await conn.execute(sql, [deleteStock.id]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Couldn\'t fusion the stock');
            }
            await registerOperation(conn, deleteStock.id, 'deleteStock');

            await conn.commit();
            logger.info('warehouse.fusionStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock merged successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.fusionStock(): Error merging Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.fusionStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error merging Stock', 1, [error]);
        }
    },

    /**
     * Divides the stock and creates a new stock with quantity = newQuantity.
     * @param {*} stock: the stock wich will be divided.
     * @param {*} newQuantity: the quantity that will form the new stock.
     * In REPEATABLE READ the update statement locks the row that matches with the id.
    */
    divideStock: async function (conn, stock, newQuantity) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, stock.location_id);
            await checkStock(conn, stock.id);

            let sql = 'UPDATE stock SET quantity = quantity - ?, version = version + 1 WHERE id = ? AND version = ?';
            let resultQuery = await conn.execute(sql, [newQuantity, stock.id, stock.version]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('The version does not match with the stock.');
            }
            await registerOperation(conn, stock.id, 'divideStock');

            sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?);';
            resultQuery = await conn.execute(sql, [newQuantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }

            sql = 'SELECT id FROM stock WHERE quantity = ? AND location_id = ? AND product_id = ? AND unit_id = ?';
            resultQuery = await conn.execute(sql, [stock.quantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (resultQuery[0].length !== 1) {
                throw new Error('Couldn\'t find the stock');
            }
            await registerOperation(conn, resultQuery[0][0].id, 'createStock');

            await conn.commit();
            logger.info('warehouse.divideStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock divided successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.divideStock(): Error dividing Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.divideStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error dividing Stock', 1, [error]);
        }
    },

    /**
     * @param {*} stock: the row that works as a container/box of the other stock.
     * @param {*} unitToGroup: is the stock that can be grouped in containers.
    */
    groupStock: async function (conn, stock, unitToGroup) {
        await conn.beginTransaction();
        try {
            await changeUnit(conn, stock, unitToGroup);
            await registerOperation(conn, stock.id, 'groupStock');
            await conn.commit();
            logger.info('warehouse.groupStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock grouped successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.groupStock(): Error grouping Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.groupStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error grouping Stock', 1, [error]);
        }
    },

    /**
     * @param {*} stock: the row that works as a container/box of the other stock.
     * @param {*} unitToUngroup: is the stock that can be ungrouped.
    */
    ungroupStock: async function (conn, stock, unitToUngroup) {
        await conn.beginTransaction();
        try {
            await changeUnit(conn, stock, unitToUngroup);
            await registerOperation(conn, stock.id, 'ungroupStock');
            await conn.commit();
            logger.info('warehouse.ungroupStock(): Transaction committed');
            return new ApiResult(200, { message: 'Stock ungrouped successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.ungroupStock(): Error ungrouping Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.ungroupStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error ungrouping Stock', 1, [error]);
        }
    },

    /**
     * Changes de location of a stock
     * UPDATE statement locks the row updated.
     */
    changeLocationStock: async function (conn, stock, newLocation) {
        await conn.beginTransaction();
        try {
            await lockLocations(conn, newLocation.id, stock.location_id);
            await checkStock(conn, stock.id);

            const sql = 'UPDATE stock SET location_id = ?, version = version + 1 WHERE id = ? AND version = ?';
            const resultQuery = await conn.execute(sql, [newLocation.id, stock.id, stock.version]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('The version does not match with the stock');
            }
            await registerOperation(conn, stock.id, 'changeLocationStock');

            await conn.commit();
            logger.info('warehouse.changeStockLocation(): Transaction committed');
            return new ApiResult(200, { message: 'Location stock changed successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.changeStockLocation(): Error changing location stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.changeStockLocation(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error changing location stock', 1, [error]);
        }
    },

    /**
     * Counts the stock of a location (group by location_id)
     */
    countLocationStock: async function (conn, stock) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, location.id);

            const sql = 'SELECT SUM(quantity) AS total_quantity FROM stock WHERE location_id = ? GROUP BY location_id;';
            const resultQuery = await conn.execute(sql, [stock.location_id]);
            if (resultQuery[0].length !== 1) {
                throw new Error('The location does not exist.');
            }
            await registerOperation(conn, stock.id, 'countLocationStock');

            await conn.commit();
            logger.info('warehouse.countLocationStock(): Transaction committed');
            return new ApiResult(200, { message: 'Location stock counted successfully' }, 1, []);
        } catch (e) {
            logger.error('warehouse.countLocationStock(): Error counting location stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.countLocationStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error counting location stock', 1, [error]);
        }
    }
};

async function changeUnit (conn, stock, newUnit) {
    await lockLocation(conn, stock.location_id);
    await checkStock(conn, stock.id);
    await checkUnit(conn, newUnit.id);

    const baseUnit = await getBaseUnit(conn, stock);
    const newQuantity = ((stock.quantity * baseUnit) / newUnit.base_unit);
    const leftStock = ((stock.quantity * baseUnit) % newUnit.base_unit);

    let sql = 'SELECT * FROM stock WHERE product_id = ? AND unit_id = ?';
    const stockToMerge = await conn.execute(sql, [stock.product_id, newUnit.id]);
    if (stockToMerge[0].length === 1) {
        sql = 'UPDATE stock set quantity = quantity + ?, version = version + 1 WHERE id = ? AND version = ?';
        const resultQuery = await conn.execute(sql, [newQuantity, stockToMerge[0][0].id, stockToMerge[0][0].version]);
        if (resultQuery[0].affectedRows !== 1) {
            throw new Error('The version does not match with the expected stock.');
        }
    } else if (stockToMerge[0].length === 0) {
        sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?)';
        const resultQuery = await conn.execute(sql, [newQuantity, stock.location_id, stock.product_id, newUnit.id]);
        if (resultQuery[0].affectedRows !== 1) {
            throw new Error('Couldn\'t insert values into stock.');
        }
    }

    sql = 'UPDATE stock set quantity = ?, version = version + 1 WHERE id = ? AND version = ?';
    const resultQuery = await conn.execute(sql, [leftStock, stock.id, stock.version]);
    if (resultQuery[0].affectedRows !== 1) {
        throw new Error('The version does not match with the introduced stock.');
    }
}

async function getBaseUnit (conn, stock) {
    const sql = 'SELECT base_unit FROM unit WHERE id = ?';
    const resultQuery = await conn.execute(sql, [stock.unit_id]);
    if (resultQuery[0].length !== 1) {
        throw new Error('The unit does not exist.');
    }
    const quantity = resultQuery[0][0].base_unit;
    return quantity;
}

async function checkStock (conn, stockId, message = '') {
    const sql = 'SELECT * FROM stock WHERE id = ?';
    const resultQuery = await conn.execute(sql, [stockId]);
    if (resultQuery[0].length !== 1) {
        throw new Error(`The ${message}stock does not exist.`);
    }
}

async function checkUnit (conn, unitId, message = '') {
    const sql = 'SELECT * FROM unit WHERE id = ?';
    const resultQuery = await conn.execute(sql, [unitId]);
    if (resultQuery[0].length !== 1) {
        throw new Error(`The ${message}unit does not exist.`);
    }
}

/**
 * @param {*} locationId :the location that will be locked.
 * The reason for using FOR UPDATE is because it avoids deadlocks by locking the reading (SELECT) of the location. Explanation:
 * If transaction1 (t1) executes this function and immediately after is executed by transaction2 (t2), then
 * t2 will wait until t1 is commit or rollback, then t2 will be unlocked and continue the execution.
 */
async function lockLocation (conn, locationId) {
    const sql = 'SELECT * FROM location WHERE id = ? FOR UPDATE';
    const selectLocation = await conn.execute(sql, [locationId]);
    if (selectLocation[0].length !== 1) {
        throw new Error('The location does not exist.');
    }
}

async function lockLocations (conn, locationId, locationBId) {
    const sql = 'SELECT * FROM location WHERE id IN ( ?, ? ) FOR UPDATE';
    const selectLocation = await conn.execute(sql, [locationId, locationBId]);
    if (selectLocation[0].length !== 2) {
        throw new Error('The locations does not exists.');
    }
}

async function registerOperation (conn, stockId, operationName) {
    const date = new Date();
    let sql = 'SELECT id FROM operation_type WHERE name = ?';
    let resultQuery = await conn.execute(sql, [operationName]);
    if (resultQuery[0].length !== 1) {
        throw new Error('Operation type does not exist.');
    }

    sql = 'INSERT INTO register (stock_id, operation_id, date) VALUES (?, ?, ?)';
    resultQuery = await conn.execute(sql, [stockId, resultQuery[0][0].id, date]);
    if (resultQuery[0].affectedRows !== 1) {
        throw new Error('Couldn\'t insert into register');
    }
}
