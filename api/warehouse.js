const logger = require('./logger');
const ApiResult = require('./ApiResult');
const ApiError = require('./ApiError');
const requestQuery = require('../api/requestQuery');

module.exports = {
    getLocation: async function (conn, location) {
        await conn.beginTransaction();
        try {
            const resultLocation = await checkLocation(conn, location.id);

            await conn.commit();
            logger.info('warehouse.getLocation(): Transaction committed');
            return new ApiResult(200, resultLocation, 1, []);
        } catch (e) {
            logger.error('warehouse.getLocation(): Error reading location: ' + e);
            await conn.rollback();
            logger.info('warehouse.getLocation(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error reading location', 1, [error]);
        }
    },

    getLocations: async function (conn, query) {
        await conn.beginTransaction();
        try {
            const filter = requestQuery.filter(query);
            const sort = requestQuery.sort(query);
            const pag = requestQuery.pagination(query);

            const sql = `SELECT * FROM location ${requestQuery.getWheres(filter)} ${requestQuery.getOrderBy(sort)} ${requestQuery.getLimit(pag)}`;
            const resultQuery = await conn.execute(sql);
            if (resultQuery[0].length < 1) {
                throw new Error('There are no locations matching the requirements');
            }

            await conn.commit();
            logger.info('warehouse.getLocations(): Transaction committed');
            return new ApiResult(200, resultQuery[0], 1, []);
        } catch (e) {
            logger.error('warehouse.getLocations(): Error reading Location: ' + e);
            await conn.rollback();
            logger.info('warehouse.getLocations(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error reading Location', 1, [error]);
        }
    },

    createLocation: async function (conn, location) {
        await conn.beginTransaction();
        try {
            let sql = 'INSERT INTO location (code, description) VALUES ( ?, ?);';
            const insertLocation = await conn.execute(sql, [location.code, location.description]);
            if (insertLocation[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into location');
            }

            sql = 'SELECT * FROM location WHERE id = ?';
            const newLocation = await conn.execute(sql, [insertLocation[0].insertId]);
            if (newLocation[0].length !== 1) {
                throw new Error('The location doesn\'t exist.');
            }

            await conn.commit();
            logger.info('warehouse.createLocation(): Transaction committed');
            return new ApiResult(201, newLocation[0][0], 1, []);
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
            const initialLocation = await checkLocation(conn, location.id);

            const sql = 'DELETE FROM location WHERE id = ?;';
            const deleteLocation = await conn.execute(sql, [location.id]);
            if (deleteLocation[0].affectedRows !== 1) {
                throw new Error('The location does not exist.');
            }

            await conn.commit();
            logger.info('warehouse.deleteLocation(): Transaction committed');
            return new ApiResult(200, initialLocation, 1, []);
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
    updateLocation: async function (conn, locationId, updateLocation) {
        await conn.beginTransaction();
        try {
            const initialLocation = await checkLocation(conn, locationId);
            await lockLocation(conn, locationId);

            const sql = 'UPDATE location SET code = ?, description = ?, version = version + 1 WHERE id = ? AND version = ?';
            const modifyLocation = await conn.execute(sql, [updateLocation.code, updateLocation.description, locationId, initialLocation.version]);
            if (modifyLocation[0].affectedRows !== 1) {
                throw new Error('The version does not match with the location.');
            }
            locationId = parseInt(locationId);
            const resultLocation = {
                id: locationId,
                code: updateLocation.code,
                description: updateLocation.description,
                version: (initialLocation.version + 1)
            };

            await conn.commit();
            logger.info('warehouse.updateLocation(): Transaction committed');
            return new ApiResult(200, resultLocation, 1, []);
        } catch (e) {
            logger.error('warehouse.updateLocation(): Error updating location: ' + e);
            await conn.rollback();
            logger.info('warehouse.updateLocation(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error updating location', 1, [error]);
        }
    },

    getStock: async function (conn, stock) {
        await conn.beginTransaction();
        try {
            const resultStock = await checkStock(conn, stock.id);

            await conn.commit();
            logger.info('warehouse.getStock(): Transaction committed');
            return new ApiResult(200, resultStock, 1, []);
        } catch (e) {
            logger.error('warehouse.getStock(): Error reading Stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.getStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error reading Stock', 1, [error]);
        }
    },

    getStocks: async function (conn, query) {
        await conn.beginTransaction();
        try {
            const filter = requestQuery.filter(query);
            const sort = requestQuery.sort(query);
            const pag = requestQuery.pagination(query);

            const sql = `SELECT * FROM stock ${requestQuery.getWheres(filter)} ${requestQuery.getOrderBy(sort)} ${requestQuery.getLimit(pag)}`;
            const resultQuery = await conn.execute(sql);
            if (resultQuery[0].length < 1) {
                throw new Error('There are no stocks matching the requirements');
            }

            await conn.commit();
            logger.info('warehouse.getStocks(): Transaction committed');
            return new ApiResult(200, resultQuery[0], 1, []);
        } catch (e) {
            logger.error('warehouse.getStocks(): Error reading Stocks: ' + e);
            await conn.rollback();
            logger.info('warehouse.getStocks(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error reading Stocks', 1, [error]);
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
            const resultQuery = await conn.execute(sql, [stock.quantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }

            sql = 'SELECT * FROM stock WHERE id = ?';
            const newStock = await conn.execute(sql, [resultQuery[0].insertId]);
            if (newStock[0].length !== 1) {
                throw new Error('The stock doesn\'t exist.');
            }

            const initialStock = {};
            const resultStock = newStock[0][0];
            await registerOperation(conn, initialStock, resultStock, 'createStock');

            await conn.commit();
            logger.info('warehouse.createStock(): Transaction committed');
            return new ApiResult(201, resultStock, 1, []);
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
            await checkStock(conn, stock.id);

            const sql = 'DELETE FROM stock WHERE id = ?;';
            const deleteStock = await conn.execute(sql, [stock.id]);
            if (deleteStock[0].affectedRows !== 1) {
                throw new Error('The stock does not exist');
            }
            const resultStock = {};
            await registerOperation(conn, stock, resultStock, 'deleteStock');

            await conn.commit();
            logger.info('warehouse.deleteStock(): Transaction committed');
            return new ApiResult(200, stock, 1, []);
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
    updateStock: async function (conn, stockId, updateStock) {
        await conn.beginTransaction();
        try {
            const initialStock = await checkStock(conn, stockId);
            await lockLocation(conn, initialStock.location_id);

            const sql = 'UPDATE stock SET quantity = ?, location_id = ?, product_id = ?, unit_id = ?, version = version + 1 WHERE id = ? AND version = ?';
            const resultQuery = await conn.execute(sql, [updateStock.quantity, updateStock.location_id, updateStock.product_id, updateStock.unit_id, stockId, initialStock.version]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('The version does not match with the stock.');
            }
            const resultStock = {
                id: stockId,
                quantity: updateStock.quantity,
                location_id: updateStock.location_id,
                product_id: updateStock.product_id,
                unit_id: updateStock.unit_id,
                version: (initialStock.version + 1)
            };
            await registerOperation(conn, initialStock, resultStock, 'updateStock');

            await conn.commit();
            logger.info('warehouse.updateStock(): Transaction committed');
            return new ApiResult(200, resultStock, 1, []);
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
     * @param {*} destinyStock: the final destiny of the stock.
     * @param {*} deleteStock: the stock that will be fusioned (quantity) and then deleted.
     */
    fusionStock: async function (conn, destinyStock, deleteStock) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, destinyStock.location_id);
            await checkFusionStocks(conn, destinyStock.id, deleteStock.id);

            let sql = 'UPDATE stock SET quantity = quantity + ?, version = version + 1 WHERE id = ? AND version = ?';
            let resultQuery = await conn.execute(sql, [deleteStock.quantity, destinyStock.id, destinyStock.version]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('The version does not match with the stock.');
            }
            const resultStock = {
                id: destinyStock.id,
                quantity: (destinyStock.quantity + deleteStock.quantity),
                location_id: destinyStock.location_id,
                product_id: destinyStock.product_id,
                unit_id: destinyStock.unit_id,
                version: (destinyStock.version + 1)
            };
            await registerOperation(conn, [destinyStock, deleteStock], resultStock, 'fusionStock');

            sql = 'DELETE FROM stock WHERE id = ?';
            resultQuery = await conn.execute(sql, [deleteStock.id]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Couldn\'t fusion the stock');
            }
            await registerOperation(conn, deleteStock, {}, 'deleteStock');

            await conn.commit();
            logger.info('warehouse.fusionStock(): Transaction committed');
            return new ApiResult(200, resultStock, 1, []);
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

            sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?);';
            resultQuery = await conn.execute(sql, [newQuantity, stock.location_id, stock.product_id, stock.unit_id]);
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Couldn\'t insert values into stock');
            }

            sql = 'SELECT * FROM stock WHERE id = ?';
            const newStock = await conn.execute(sql, [resultQuery[0].insertId]);
            if (newStock[0].length !== 1) {
                throw new Error('The stock doesn\'t exist.');
            }

            // The result of dividing one stock is two resultStocks.
            const resultStock1 = {
                id: stock.id,
                quantity: (stock.quantity - newQuantity),
                location_id: stock.location_id,
                product_id: stock.product_id,
                unit_id: stock.unit_id,
                version: (stock.version + 1)
            };
            await registerOperation(conn, stock, resultStock1, 'divideStock');

            const resultStock2 = newStock[0][0];
            await registerOperation(conn, stock, resultStock2, 'divideStock');

            await conn.commit();
            logger.info('warehouse.divideStock(): Transaction committed');
            return new ApiResult(200, [resultStock1, resultStock2], 1, []);
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
            const resultStock = await changeUnit(conn, stock, unitToGroup);
            await registerOperation(conn, stock, resultStock, 'groupStock');
            await conn.commit();
            logger.info('warehouse.groupStock(): Transaction committed');
            return new ApiResult(200, resultStock, 1, []);
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
            const resultStock = await changeUnit(conn, stock, unitToUngroup);
            await registerOperation(conn, stock, resultStock, 'ungroupStock');
            await conn.commit();
            logger.info('warehouse.ungroupStock(): Transaction committed');
            return new ApiResult(200, resultStock, 1, []);
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
            const resultStock = {
                id: stock.id,
                quantity: stock.quantity,
                location_id: newLocation.id,
                product_id: stock.product_id,
                unit_id: stock.unit_id,
                version: (stock.version + 1)
            };
            await registerOperation(conn, stock, resultStock, 'changeLocationStock');

            await conn.commit();
            logger.info('warehouse.changeStockLocation(): Transaction committed');
            return new ApiResult(200, resultStock, 1, []);
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
    countLocationStock: async function (conn, location) {
        await conn.beginTransaction();
        try {
            await lockLocation(conn, location.id);

            const sql = 'SELECT SUM(quantity) AS total_quantity FROM stock WHERE location_id = ? GROUP BY location_id;';
            const resultQuery = await conn.execute(sql, [location.id]);
            if (resultQuery[0].length !== 1) {
                throw new Error('The location does not exist.');
            }

            await conn.commit();
            resultQuery[0][0].total_quantity = parseInt(resultQuery[0][0].total_quantity);
            logger.info('warehouse.countLocationStock(): Transaction committed');
            return new ApiResult(200, resultQuery[0][0], 1, []);
        } catch (e) {
            logger.error('warehouse.countLocationStock(): Error counting location stock: ' + e);
            await conn.rollback();
            logger.info('warehouse.countLocationStock(): Transaction rolled back');
            const error = new ApiError('REG01', e.message, '', '');
            return new ApiResult(500, 'Error counting location stock', 1, [error]);
        }
    }
};

/**
 * Checks that both stocks meet the condition to be merged.
 * The condition is to have the same location_id, unit_id and product_id.
 * @param {*} resultStock the stock that will survive to the fusion and into which the other stock will be added.
 * @param {*} deleteStock the stock that will be deleted at the end of the fusion.
 */
async function checkFusionStocks (conn, resultStockId, deleteStockId) {
    const sql1 = 'SELECT * FROM stock where id = ?';
    const resultQuery1 = await conn.execute(sql1, [resultStockId]);
    if (resultQuery1[0].length === 0) {
        throw new Error('The resultStock does not exist.');
    }

    const sql2 = 'SELECT * FROM stock where id = ?';
    const resultQuery2 = await conn.execute(sql2, [deleteStockId]);
    if (resultQuery2[0].length === 0) {
        throw new Error('The deleteStock does not exist.');
    }

    if (resultQuery1[0][0].location_id !== resultQuery2[0][0].location_id ||
        resultQuery1[0][0].product_id !== resultQuery2[0][0].product_id ||
        resultQuery1[0][0].unit_id !== resultQuery2[0][0].unit_id) {
        throw new Error('The stocks cannot be merged');
    }
    return [resultQuery1[0][0], resultQuery2[0][0]];
}

/**
 * @param {*} stock The stock which we want to change to a higher or lower unit
 * @param {*} newUnit The unit to which the stock will be changed.
 */
async function changeUnit (conn, stock, newUnit) {
    await lockLocation(conn, stock.location_id);
    await checkStock(conn, stock.id);
    await checkUnit(conn, newUnit.id);

    const baseUnit = await getBaseUnit(conn, stock);
    const newQuantity = Math.floor(((stock.quantity * baseUnit) / newUnit.base_unit));
    const leftStock = ((stock.quantity * baseUnit) % newUnit.base_unit);
    const resultStock1 = await setResultStock(conn, stock, newUnit, newQuantity);

    const sql = 'UPDATE stock set quantity = ?, version = version + 1 WHERE id = ? AND version = ?';
    const resultQuery = await conn.execute(sql, [leftStock, stock.id, stock.version]);
    if (resultQuery[0].affectedRows !== 1) {
        throw new Error('The version does not match with the introduced stock.');
    }

    const resultStock2 = {
        id: stock.id,
        quantity: leftStock,
        location_id: stock.location_id,
        product_id: stock.product_id,
        unit_id: stock.unit_id,
        version: (stock.version + 1)
    };
    return [resultStock2, resultStock1];
}

/**
 * @param {*} stock The stock that will be grouped or ungrouped.
 * @param {*} newUnit The unit to which we want to change the stock.
 * @param {*} newQuantity the quantity of the stock with the inserted unit.
 * @returns if exists a stock equal to the param stock but with a unit_id equal to the newUnit, then returns the same stock with the quantity and version modified.
 * if that stock doesn't exist, then it returns the new stock created with the unit_id of the newUnit.
 */
async function setResultStock (conn, stock, newUnit, newQuantity) {
    let resultStock;

    let sql = 'SELECT * FROM stock WHERE product_id = ? AND unit_id = ?';
    const stockToMerge = await conn.execute(sql, [stock.product_id, newUnit.id]);
    if (stockToMerge[0].length >= 1) {
        sql = 'UPDATE stock set quantity = quantity + ?, version = version + 1 WHERE id = ? AND version = ?';
        const resultQuery = await conn.execute(sql, [newQuantity, stockToMerge[0][0].id, stockToMerge[0][0].version]);
        if (resultQuery[0].affectedRows !== 1) {
            throw new Error('The version does not match with the expected stock.');
        }
        resultStock = {
            id: stockToMerge[0][0].id,
            quantity: (stockToMerge[0][0].quantity + newQuantity),
            location_id: stockToMerge[0][0].location_id,
            product_id: stockToMerge[0][0].product_id,
            unit_id: stockToMerge[0][0].unit_id,
            version: (stockToMerge[0][0].version + 1)
        };
    } else if (stockToMerge[0].length === 0) {
        sql = 'INSERT INTO stock (quantity, location_id, product_id, unit_id) VALUES (?, ?, ?, ?)';
        const resultQuery = await conn.execute(sql, [newQuantity, stock.location_id, stock.product_id, newUnit.id]);
        if (resultQuery[0].affectedRows !== 1) {
            throw new Error('Couldn\'t insert values into stock.');
        }

        sql = 'SELECT * FROM stock WHERE id = ?';
        const newStock = await conn.execute(sql, [resultQuery[0].insertId]);
        if (newStock[0].length !== 1) {
            throw new Error('The stock doesn\'t exist.');
        }
        resultStock = newStock[0][0];
    }
    return (resultStock);
}

/**
 * It gets the base_unit using the unit_id from a stock
 * Only used inside the function changeUnit()
 */
async function getBaseUnit (conn, stock) {
    const sql = 'SELECT base_unit FROM unit WHERE id = ?';
    const resultQuery = await conn.execute(sql, [stock.unit_id]);
    if (resultQuery[0].length !== 1) {
        throw new Error('The stock unit does not exist.');
    }
    const quantity = resultQuery[0][0].base_unit;
    return quantity;
}

/**
 * Verifies that the location exist.
 */
async function checkLocation (conn, locationId) {
    const sql = 'SELECT * FROM location WHERE id = ?';
    const resultQuery = await conn.execute(sql, [locationId]);
    if (resultQuery[0].length !== 1) {
        throw new Error('The location does not exist.');
    }
    return resultQuery[0][0];
}

/**
 * Verifies that the stock exist.
 */
async function checkStock (conn, stockId) {
    const sql = 'SELECT * FROM stock WHERE id = ?';
    const resultQuery = await conn.execute(sql, [stockId]);
    if (resultQuery[0].length !== 1) {
        throw new Error('The stock does not exist.');
    }
    return resultQuery[0][0];
}

/**
 * Verifies that the unit exist.
 */
async function checkUnit (conn, unitId) {
    const sql = 'SELECT * FROM unit WHERE id = ?';
    const resultQuery = await conn.execute(sql, [unitId]);
    if (resultQuery[0].length !== 1) {
        throw new Error('The unit does not exist.');
    }
    return resultQuery[0][0];
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

/**
 * It has the same function than lockLocation but is used in group and ungroup functions
 */
async function lockLocations (conn, locationId, locationBId) {
    const sql = 'SELECT * FROM location WHERE id IN ( ?, ? ) FOR UPDATE';
    const selectLocation = await conn.execute(sql, [locationId, locationBId]);
    if (selectLocation[0].length !== 2) {
        throw new Error('The locations does not exists.');
    }
}

/**
 * Insert a new row into register table with the name of the statement and the id of the stock.
 */
async function registerOperation (conn, initialStock, resultStock, operationName) {
    const date = getFormattedDate();
    let sql = 'SELECT id FROM operation_type WHERE name = ?';
    let resultQuery = await conn.execute(sql, [operationName]);
    if (resultQuery[0].length !== 1) {
        throw new Error('Operation type does not exist.');
    }

    sql = 'INSERT INTO register (initial_stock, result_stock, operation_type_id, date) VALUES (?, ?, ?, ?)';
    resultQuery = await conn.execute(sql, [initialStock, resultStock, resultQuery[0][0].id, date]);
    if (resultQuery[0].affectedRows !== 1) {
        throw new Error('Couldn\'t insert into register');
    }
}

/**
 * several methods are used to get all the information in the correct format.
 * padStart(2, 0) serves to add 0 when the string has less than 2 char.
 * Finally concat all the constants separated by '-' (the format datetime requires it).
 * @returns the current date with format datetime ('YYYY-MM-DD hh:mm:ss')
 */
function getFormattedDate () {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    return formattedDate;
}
