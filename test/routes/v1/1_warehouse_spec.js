const chai = require('chai');
const dirtyChai = require('dirty-chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const { after, describe, it } = require('mocha');

chai.use(dirtyChai);
chai.use(chaiHttp);

const URL = 'http://localhost:3000/v1/warehouse';
const DB_SETUP_URL = 'http://localhost:3000/v1/db-test';  // Nueva API para la base de datos

const LOCATION_NEW = {
    code: 'LOC1',
    description: 'New Location 1',
    version: 0
};

const STOCK_NEW = {
    quantity: 25,
    location_id: 1,
    product_id: 1,
    unit_id: 1,
    version: 0
};

const STOCK_NEW2 = {
    quantity: 25,
    location_id: 1,
    product_id: 1,
    unit_id: 2,
    version: 0
};

const UNIT1 = {
    id: 1,
    base_unit: 1
};

const UNIT10 = {
    id: 2,
    base_unit: 10
};

const TENANT_ID_TEST = 999;

describe('API Warehouse', function () {
    this.timeout(10000); // Aumentamos el timeout para operaciones de base de datos

    let createdLocationId; // Guardamos el ID de la ubicación creada
    let createdStockId;    // Guardamos el ID del stock creado

    // Crear la base de datos antes de las pruebas
    before(async function () {
        const res = await chai.request(DB_SETUP_URL).post('/');
        expect(res.statusCode).to.equal(201);
    });

    // Eliminar la base de datos después de las pruebas
    after(async function () {
        const res = await chai.request(DB_SETUP_URL).delete('/');
        expect(res.statusCode).to.equal(200);
    });

    // ----------GET ALL-----------
    it('should return all locations', async () => {
        const locations = await chai.request(URL).get(`/location?id=${TENANT_ID_TEST}`);
        expect(locations.statusCode).to.equal(200);
        expect(locations.body.data).to.be.an('array');
        
        if (locations.body.requestId) {
            expect(locations.body.requestId).to.be.a('number');
        }
        
        expect(locations.body.errors).to.be.an('array').that.eql([]);
    });

    // ----------GET ONE-----------
    it('should return one locations', async () => {
        const locations = await chai.request(URL).get(`/location/1?id=${TENANT_ID_TEST}`);
        expect(locations.statusCode).to.equal(200);
        expect(locations.body.data).to.be.an('object');
        
        if (locations.body.requestId) {
            expect(locations.body.requestId).to.be.a('number');
        }
        
        expect(locations.body.errors).to.be.an('array').that.eql([]);
    });

    it('should return one stock', async () => {
        const stockCreationResponse = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        
        // Verifica que el stock fue creado exitosamente
        expect(stockCreationResponse.statusCode).to.equal(201);
        expect(stockCreationResponse.body.data).to.be.an('object');
        
        // Si existe un requestId, asegúrate de que sea del tipo correcto
        if (stockCreationResponse.body.requestId) {
            expect(stockCreationResponse.body.requestId).to.be.a('number'); // Cambiado a número en lugar de string
        }
        
        expect(stockCreationResponse.body.errors).to.be.an('array').that.eql([]);
        
        const stockId = stockCreationResponse.body.data.id;
        const stockVersion = stockCreationResponse.body.data.version;
    
        const stockResponse = await chai.request(URL).get(`/stock/${stockId}?id=${TENANT_ID_TEST}`);
        expect(stockResponse.statusCode).to.equal(200);
        expect(stockResponse.body.data).to.be.an('object');
        
        const deleteStockResponse = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stockId,
            quantity: STOCK_NEW.quantity,
            location_id: STOCK_NEW.location_id,
            product_id: STOCK_NEW.product_id,
            unit_id: STOCK_NEW.unit_id,
            version: stockVersion
        });
        
        expect(deleteStockResponse.statusCode).to.equal(200);
        expect(deleteStockResponse.body.data).to.be.an('object');
        
        // Valida que el requestId sea numérico
        if (deleteStockResponse.body.requestId) {
            expect(deleteStockResponse.body.requestId).to.be.a('number'); // Cambiado a número
        }
        
        expect(deleteStockResponse.body.errors).to.be.an('array').that.eql([]);
    });
    // ----------CREATE-----------
    it('should return all stocks', async () => {
        // Crear stock
        const createStock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(createStock.statusCode).to.equal(201);
        expect(createStock.body.data).to.be.an('object');
        
        // Ajustar según el tipo de requestId, aquí debería ser 'number'
        if (createStock.body.requestId) {
            expect(createStock.body.requestId).to.be.a('number'); // Cambiado de 'string' a 'number'
        }
        
        expect(createStock.body.errors).to.be.an('array').that.eql([]);
    
        // Obtener todos los stocks
        const stock = await chai.request(URL).get(`/stock?id=${TENANT_ID_TEST}`);
        expect(stock.statusCode).to.equal(200);
        expect(stock.body.data).to.be.an('array');
        
        // Ajustar tipo para requestId si es necesario
        if (stock.body.requestId) {
            expect(stock.body.requestId).to.be.a('number'); 
        }
        
        expect(stock.body.errors).to.be.an('array').that.eql([]);
    
        // Obtener stocks con límites
        const stockLimits = await chai.request(URL).get(`/stock?id=${TENANT_ID_TEST}&skip=0&limit=1&sort=quantity:ASC&filter=quantity:gt:0`);
        expect(stockLimits.statusCode).to.equal(200);
        expect(stockLimits.body.data).to.be.an('array');
        
        // Ajuste según tipo de requestId
        if (stockLimits.body.requestId) {
            expect(stockLimits.body.requestId).to.be.a('number'); 
        }
        
        expect(stockLimits.body.errors).to.be.an('array').that.eql([]);
    
        // Eliminar stock
        const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: createStock.body.data.id,
            quantity: STOCK_NEW.quantity,
            location_id: STOCK_NEW.location_id,
            product_id: STOCK_NEW.product_id,
            unit_id: STOCK_NEW.unit_id,
            version: createStock.body.data.version
        });
        expect(deleteStock.statusCode).to.equal(200);
        expect(deleteStock.body.data).to.be.an('object');
        
        // Ajustar tipo de requestId
        if (deleteStock.body.requestId) {
            expect(deleteStock.body.requestId).to.be.a('number'); 
        }
        
        expect(deleteStock.body.errors).to.be.an('array').that.eql([]);
    });
    // ----------GET ERROR-----------

    it('should return 500 if the location requested does not exist', async () => {
        const location = await chai.request(URL).get(`/location/9999?id=${TENANT_ID_TEST}`);
        expect(location.statusCode).to.equal(500);
        
        if (location.body.requestId) {
            expect(location.body.requestId).to.be.a('number');
        }
        
        expect(location.body.errors).to.be.an('array');
        expect(location.body.errors).to.deep.equal([{
            code: 'REG01',
            message: 'The location does not exist.',
            detail: '',
            help: ''
        }]);
    });

    it('should return 500 if the stock requested does not exist', async () => {
        const stock = await chai.request(URL).get(`/stock/9999?id=${TENANT_ID_TEST}`);
        expect(stock.statusCode).to.equal(500);
        
        if (stock.body.requestId) {
            expect(stock.body.requestId).to.be.a('number');
        }
        
        expect(stock.body.errors).to.be.an('array');
        expect(stock.body.errors).to.deep.equal([{
            code: 'REG01',
            message: 'The stock does not exist.',
            detail: '',
            help: ''
        }]);
    });

    // ----------POST-----------
    it('should create a new location', async () => {
        const location = await chai.request(URL).post(`/location?id=${TENANT_ID_TEST}`).send(LOCATION_NEW);
        expect(location.statusCode).to.equal(201);
        expect(location.body.data).to.be.an('object');
        
        if (location.body.requestId) {
            expect(location.body.requestId).to.be.a('number');
        }
        
        expect(location.body.errors).to.be.an('array').that.eql([]);
    
        const deleteLocation = await chai.request(URL).delete(`/location/${location.body.data.id}?id=${TENANT_ID_TEST}`);
        expect(deleteLocation.statusCode).to.equal(200);
        expect(deleteLocation.body.data).to.be.an('object');
        
        if (deleteLocation.body.requestId) {
            expect(deleteLocation.body.requestId).to.be.a('number');
        }
        
        expect(deleteLocation.body.errors).to.be.an('array').that.eql([]);
    });

    it('should create a new stock', async () => {
        const stock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock.statusCode).to.equal(201);
        expect(stock.body.data).to.be.an('object');
        
        if (stock.body.requestId) {
            expect(stock.body.requestId).to.be.a('number');
        }
        
        expect(stock.body.errors).to.be.an('array').that.eql([]);
    
        const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock.body.data.id,
            quantity: STOCK_NEW.quantity,
            location_id: STOCK_NEW.location_id,
            product_id: STOCK_NEW.product_id,
            unit_id: STOCK_NEW.unit_id,
            version: stock.body.data.version
        });
        expect(deleteStock.statusCode).to.equal(200);
        expect(deleteStock.body.data).to.be.an('object');
        
        if (deleteStock.body.requestId) {
            expect(deleteStock.body.requestId).to.be.a('number');
        }
        
        expect(deleteStock.body.errors).to.be.an('array').that.eql([]);
    });

    // ----------PUT-----------
    it('should update a location', async () => {
        // Crear una nueva ubicación
        const location = await chai.request(URL).post(`/location?id=${TENANT_ID_TEST}`).send(LOCATION_NEW);
        expect(location.statusCode).to.equal(201);
        expect(location.body.data).to.be.an('object');
        
        // Verificar que requestId es un número en la respuesta de creación de la ubicación
        if (location.body.requestId) {
            expect(location.body.requestId).to.be.a('number');
        }
        
        expect(location.body.errors).to.be.an('array').that.eql([]);
        
        // Actualizar la ubicación recién creada
        const updateLocation = await chai.request(URL).put(`/location/${location.body.data.id}?id=${TENANT_ID_TEST}`).send({
            code: 'LOC1',
            description: 'New Location 1 updated'
        });
        expect(updateLocation.statusCode).to.equal(200);
        expect(updateLocation.body.data).to.be.an('object');
        
        // Verificar que requestId es un string en la respuesta de actualización de la ubicación
        if (updateLocation.body.requestId) {
            expect(updateLocation.body.requestId).to.be.a('number');
        }
        
        expect(updateLocation.body.errors).to.be.an('array').that.eql([]);
        
        // Verificar los datos actualizados de la ubicación
        expect(updateLocation.body.data).to.deep.equal({
            id: updateLocation.body.data.id,
            code: 'LOC1',
            description: 'New Location 1 updated',
            version: updateLocation.body.data.version
        });
    
        // Eliminar la ubicación recién creada
        const deleteLocation = await chai.request(URL).delete(`/location/${location.body.data.id}?id=${TENANT_ID_TEST}`);
        expect(deleteLocation.statusCode).to.equal(200);
        expect(deleteLocation.body.data).to.be.an('object');
        
        // Verificar que requestId es un string en la respuesta de eliminación de la ubicación
        if (deleteLocation.body.requestId) {
            expect(deleteLocation.body.requestId).to.be.a('number');
        }
        
        expect(deleteLocation.body.errors).to.be.an('array').that.eql([]);
    });
    it('should update a stock', async () => {
        // Crear un nuevo stock
        const stock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock.statusCode).to.equal(201);
        expect(stock.body.data).to.be.an('object');
    
        // Verificar que requestId es un número en la respuesta de creación del stock
        if (stock.body.requestId) {
            expect(stock.body.requestId).to.be.a('number');
        }
        
        expect(stock.body.errors).to.be.an('array').that.eql([]);
    
        // Actualizar el stock recién creado
        const updateStock = await chai.request(URL).put(`/stock/${stock.body.data.id}?id=${TENANT_ID_TEST}`).send({
            quantity: 25,
            location_id: 1,
            product_id: 1,
            unit_id: 1
        });
        expect(updateStock.statusCode).to.equal(200);
        expect(updateStock.body.data).to.be.an('object');
    
        // Verificar que requestId es un número en la respuesta de actualización del stock
        if (updateStock.body.requestId) {
            expect(updateStock.body.requestId).to.be.a('number');  
        }
        
        expect(updateStock.body.errors).to.be.an('array').that.eql([]);
        
        // Verificar los datos actualizados del stock
        expect(updateStock.body.data).to.deep.equal({
            id: updateStock.body.data.id,
            quantity: 25,
            location_id: 1,
            product_id: 1,
            unit_id: 1,
            version: updateStock.body.data.version
        });
    
        // Eliminar el stock recién creado
        const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: updateStock.body.data.id,
            quantity: 25,
            location_id: 1,
            product_id: 1,
            unit_id: 1,
            version: updateStock.body.data.version
        });
        expect(deleteStock.statusCode).to.equal(200);
        expect(deleteStock.body.data).to.be.an('object');
    
        // Verificar que requestId es un número en la respuesta de eliminación del stock
        if (deleteStock.body.requestId) {
            expect(deleteStock.body.requestId).to.be.a('number');
        }
    
        expect(deleteStock.body.errors).to.be.an('array').that.eql([]);
    });
    // ----------PUT ERROR-----------

    it('should return 500 if the location requested for updating does not exist', async () => {
        const updateLocation = await chai.request(URL).put(`/location/9999?id=${TENANT_ID_TEST}`).send({
            code: 'LOC1',
            description: 'New Location 1 updated'
        });
        expect(updateLocation.statusCode).to.equal(500);
    
        if (updateLocation.body.requestId) {
            expect(updateLocation.body.requestId).to.be.a('number');
        }
    
        expect(updateLocation.body.errors).to.be.an('array').that.eql([{
            code: 'REG01',
            message: 'The location does not exist.',
            detail: '',
            help: ''
        }]);
    });

    it('should return 500 if the stock requested for updating does not exist', async () => {
        const updateStock = await chai.request(URL).put(`/stock/9999?id=${TENANT_ID_TEST}`).send({
            quantity: 25,
            location_id: 1,
            product_id: 1,
            unit_id: 1
        });
        expect(updateStock.statusCode).to.equal(500);
    
        if (updateStock.body.requestId) {
            expect(updateStock.body.requestId).to.be.a('number');
        }
    
        expect(updateStock.body.errors).to.be.an('array').that.eql([{
            code: 'REG01',
            message: 'The stock does not exist.',
            detail: '',
            help: ''
        }]);
    });


    // ----------DELETE-----------
    it('should delete a location', async () => {
        // Crear una nueva ubicación
        const location = await chai.request(URL).post(`/location?id=${TENANT_ID_TEST}`).send(LOCATION_NEW);
        expect(location.statusCode).to.equal(201);
        expect(location.body.data).to.be.an('object');
    
        // Verificar si el requestId está en la respuesta de la creación
        if (location.body.requestId) {
            expect(location.body.requestId).to.be.a('number');
        }
        
        expect(location.body.errors).to.be.an('array').that.eql([]);
    
        // Eliminar la ubicación creada
        const deleteLocation = await chai.request(URL).delete(`/location/${location.body.data.id}?id=${TENANT_ID_TEST}`);
        expect(deleteLocation.statusCode).to.equal(200);
        expect(deleteLocation.body.data).to.be.an('object');
    
        // Verificar si el requestId está en la respuesta de la eliminación
        if (deleteLocation.body.requestId) {
            expect(deleteLocation.body.requestId).to.be.a('number');
        }
        
        expect(deleteLocation.body.errors).to.be.an('array').that.eql([]);
    });

    it('should delete a stock', async () => {
        // Crear un nuevo stock
        const stock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock.statusCode).to.equal(201);
        expect(stock.body.data).to.be.an('object');
    
        // Verificar si el requestId está en la respuesta de la creación
        if (stock.body.requestId) {
            expect(stock.body.requestId).to.be.a('number');
        }
    
        expect(stock.body.errors).to.be.an('array').that.eql([]);
    
        // Eliminar el stock creado
        const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock.body.data.id,
            quantity: STOCK_NEW.quantity,
            location_id: STOCK_NEW.location_id,
            product_id: STOCK_NEW.product_id,
            unit_id: STOCK_NEW.unit_id,
            version: stock.body.data.version
        });
    
        expect(deleteStock.statusCode).to.equal(200);
        expect(deleteStock.body.data).to.be.an('object');
    
        // Verificar si el requestId está en la respuesta de la eliminación
        if (deleteStock.body.requestId) {
            expect(deleteStock.body.requestId).to.be.a('number');
        }
        
        expect(deleteStock.body.errors).to.be.an('array').that.eql([]);
    });
    // ----------DELETE ERROR-----------
    it('should return 500 if the location requested to delete does not exist', async () => {
        const deleteLocation = await chai.request(URL).delete(`/location/9999?id=${TENANT_ID_TEST}`);
        expect(deleteLocation.statusCode).to.equal(500);
    
        if (deleteLocation.body.requestId) {
            expect(deleteLocation.body.requestId).to.be.a('number');
        }
        
        expect(deleteLocation.body.errors).to.be.an('array').that.eql([{
            code: 'REG01',
            message: 'The location does not exist.',
            detail: '',
            help: ''
        }]);
    });


    it('should return 500 if the stock requested to delete does not exist', async () => {
    const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
        id: 9999,
        quantity: STOCK_NEW.quantity,
        location_id: STOCK_NEW.location_id,
        product_id: STOCK_NEW.product_id,
        unit_id: STOCK_NEW.unit_id,
        version: 0
    });
    expect(deleteStock.statusCode).to.equal(500);
    
    if (deleteStock.body.requestId) {
        expect(deleteStock.body.requestId).to.be.a('number');
    }

    expect(deleteStock.body.errors).to.be.an('array').that.eql([{
        code: 'REG01',
        message: 'The stock does not exist.',
        detail: '',
        help: ''
    }]);
});

    // ----------POST FUSION-----------
    it('should fusion two stocks', async () => {
        const stock1 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock1.statusCode).to.equal(201);
        expect(stock1.body.data).to.be.an('object');
        
        if (stock1.body.requestId) {
            expect(stock1.body.requestId).to.be.a('number');
        }
        
        expect(stock1.body.errors).to.be.an('array').that.eql([]);
    
        const stock2 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock2.statusCode).to.equal(201);
        expect(stock2.body.data).to.be.an('object');
        
        if (stock2.body.requestId) {
            expect(stock2.body.requestId).to.be.a('number');
        }
        
        expect(stock2.body.errors).to.be.an('array').that.eql([]);
    
        const fusionStock = await chai.request(URL).post(`/stock/fusion?id=${TENANT_ID_TEST}`).send([
            {
                id: stock1.body.data.id,
                quantity: stock1.body.data.quantity,
                location_id: stock1.body.data.location_id,
                product_id: stock1.body.data.product_id,
                unit_id: stock1.body.data.unit_id,
                version: stock1.body.data.version
            },
            {
                id: stock2.body.data.id,
                quantity: stock2.body.data.quantity,
                location_id: stock2.body.data.location_id,
                product_id: stock2.body.data.product_id,
                unit_id: stock2.body.data.unit_id,
                version: stock2.body.data.version
            }
        ]);
        expect(fusionStock.statusCode).to.equal(200);
        expect(fusionStock.body.data).to.be.an('object');
        
        if (fusionStock.body.requestId) {
            expect(fusionStock.body.requestId).to.be.a('number');
        }
        
        expect(fusionStock.body.errors).to.be.an('array').that.eql([]);
    
        const deleteFusion = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: fusionStock.body.data.id,
            quantity: fusionStock.body.data.quantity,
            location_id: fusionStock.body.data.location_id,
            product_id: fusionStock.body.data.product_id,
            unit_id: fusionStock.body.data.unit_id,
            version: fusionStock.body.data.version
        });
        expect(deleteFusion.statusCode).to.equal(200);
        expect(deleteFusion.body.data).to.be.an('object');
        
        if (deleteFusion.body.requestId) {
            expect(deleteFusion.body.requestId).to.be.a('number');
        }
        
        expect(deleteFusion.body.errors).to.be.an('array').that.eql([]);
    });
    // ----------POST FUSION ERROR -----------
    it('should return 500 if the stocks are not compatible', async () => {
        const stock1 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock1.statusCode).to.equal(201);
        expect(stock1.body.data).to.be.an('object');
        
        if (stock1.body.requestId) {
            expect(stock1.body.requestId).to.be.a('number');
        }
        
        expect(stock1.body.errors).to.be.an('array').that.eql([]);
    
        const stock2 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send({
            quantity: 25,
            location_id: 2,
            product_id: 1,
            unit_id: 1
        });
        expect(stock2.statusCode).to.equal(201);
        expect(stock2.body.data).to.be.an('object');
        
        if (stock2.body.requestId) {
            expect(stock2.body.requestId).to.be.a('number');
        }
        
        expect(stock2.body.errors).to.be.an('array').that.eql([]);
    
        const fusionStock = await chai.request(URL).post(`/stock/fusion?id=${TENANT_ID_TEST}`).send([
            {
                id: stock1.body.data.id,
                quantity: stock1.body.data.quantity,
                location_id: stock1.body.data.location_id,
                product_id: stock1.body.data.product_id,
                unit_id: stock1.body.data.unit_id,
                version: stock1.body.data.version
            },
            {
                id: stock2.body.data.id,
                quantity: stock2.body.data.quantity,
                location_id: stock2.body.data.location_id,
                product_id: stock2.body.data.product_id,
                unit_id: stock2.body.data.unit_id,
                version: stock2.body.data.version
            }
        ]);
        expect(fusionStock.statusCode).to.equal(500);
        
        if (fusionStock.body.requestId) {
            expect(fusionStock.body.requestId).to.be.a('number');
        }
        
        expect(fusionStock.body.errors).to.be.an('array').that.eql([{
            code: 'REG01',
            message: 'The stocks cannot be merged',
            detail: '',
            help: ''
        }]);
    
        const deleteStock1 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock1.body.data.id,
            quantity: stock1.body.data.quantity,
            location_id: stock1.body.data.location_id,
            product_id: stock1.body.data.product_id,
            unit_id: stock1.body.data.unit_id,
            version: stock1.body.data.version
        });
        expect(deleteStock1.statusCode).to.equal(200);
        expect(deleteStock1.body.data).to.be.an('object');
        
        if (deleteStock1.body.requestId) {
            expect(deleteStock1.body.requestId).to.be.a('number');
        }
        
        expect(deleteStock1.body.errors).to.be.an('array').that.eql([]);
    
        const deleteStock2 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock2.body.data.id,
            quantity: stock2.body.data.quantity,
            location_id: stock2.body.data.location_id,
            product_id: stock2.body.data.product_id,
            unit_id: stock2.body.data.unit_id,
            version: stock2.body.data.version
        });
        expect(deleteStock2.statusCode).to.equal(200);
        expect(deleteStock2.body.data).to.be.an('object');
        
        if (deleteStock2.body.requestId) {
            expect(deleteStock2.body.requestId).to.be.a('number');
        }
        
        expect(deleteStock2.body.errors).to.be.an('array').that.eql([]);
    });

    // ----------POST DIVISION -----------
it('should divide one stock', async () => {
    const stock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
    expect(stock.statusCode).to.equal(201);
    expect(stock.body.data).to.be.an('object');
    
    if (stock.body.requestId) {
        expect(stock.body.requestId).to.be.a('number');
    }
    
    expect(stock.body.errors).to.be.an('array').that.eql([]);

    const divideStock = await chai.request(URL).post(`/stock/divide?id=${TENANT_ID_TEST}`).send([
        {
            id: stock.body.data.id,
            quantity: stock.body.data.quantity,
            location_id: stock.body.data.location_id,
            product_id: stock.body.data.product_id,
            unit_id: stock.body.data.unit_id,
            version: stock.body.data.version
        },
        {
            quantity: 10
        }
    ]);
    expect(divideStock.statusCode).to.equal(200);
    expect(divideStock.body.data).to.be.an('array');
    
    if (divideStock.body.requestId) {
        expect(divideStock.body.requestId).to.be.a('number');
    }
    
    expect(divideStock.body.errors).to.be.an('array').that.eql([]);

    const deleteStock1 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
        id: divideStock.body.data[0].id,
        quantity: divideStock.body.data[0].quantity,
        location_id: divideStock.body.data[0].location_id,
        product_id: divideStock.body.data[0].product_id,
        unit_id: divideStock.body.data[0].unit_id,
        version: divideStock.body.data[0].version
    });
    expect(deleteStock1.statusCode).to.equal(200);
    expect(deleteStock1.body.data).to.be.an('object');
    
    if (deleteStock1.body.requestId) {
        expect(deleteStock1.body.requestId).to.be.a('number');
    }
    
    expect(deleteStock1.body.errors).to.be.an('array').that.eql([]);

    const deleteStock2 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
        id: divideStock.body.data[1].id,
        quantity: divideStock.body.data[1].quantity,
        location_id: divideStock.body.data[1].location_id,
        product_id: divideStock.body.data[1].product_id,
        unit_id: divideStock.body.data[1].unit_id,
        version: divideStock.body.data[1].version
    });
    expect(deleteStock2.statusCode).to.equal(200);
    expect(deleteStock2.body.data).to.be.an('object');
    
    if (deleteStock2.body.requestId) {
        expect(deleteStock2.body.requestId).to.be.a('number');
    }
    
    expect(deleteStock2.body.errors).to.be.an('array').that.eql([]);
});

    // ----------POST DIVISION ERROR -----------
    it('should return 500 if the stock requested for dividing does not exist', async () => {
        const divideStock = await chai.request(URL).post(`/stock/divide?id=${TENANT_ID_TEST}`).send([
            {
                id: 9999,
                quantity: STOCK_NEW.quantity,
                location_id: STOCK_NEW.location_id,
                product_id: STOCK_NEW.product_id,
                unit_id: STOCK_NEW.unit_id,
                version: 0
            },
            {
                quantity: 10
            }
        ]);
        expect(divideStock.statusCode).to.equal(500);
        
        if (divideStock.body.requestId) {
            expect(divideStock.body.requestId).to.be.a('number');
        }
        
        expect(divideStock.body.errors).to.be.an('array').that.eql([{
            code: 'REG01',
            message: 'The stock does not exist.',
            detail: '',
            help: ''
        }]);
    });

    // ----------POST GROUP -----------
    it('should group one stock', async () => {
        const stock1 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock1.statusCode).to.equal(201);
        expect(stock1.body.data).to.be.an('object');
        
        if (stock1.body.requestId) {
            expect(stock1.body.requestId).to.be.a('number');
        }
        
        expect(stock1.body.errors).to.be.an('array').that.eql([]);
    
        const stock2 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW2);
        expect(stock2.statusCode).to.equal(201);
        expect(stock2.body.data).to.be.an('object');
        
        if (stock2.body.requestId) {
            expect(stock2.body.requestId).to.be.a('number');
        }
        
        expect(stock2.body.errors).to.be.an('array').that.eql([]);
    
        const groupStock = await chai.request(URL).post(`/stock/group?id=${TENANT_ID_TEST}`).send([
            {
                id: stock1.body.data.id,
                quantity: stock1.body.data.quantity,
                location_id: stock1.body.data.location_id,
                product_id: stock1.body.data.product_id,
                unit_id: stock1.body.data.unit_id,
                version: stock1.body.data.version
            },
            UNIT10
        ]);
        expect(groupStock.statusCode).to.equal(200);
        expect(groupStock.body.data).to.be.an('array');
        
        if (groupStock.body.requestId) {
            expect(groupStock.body.requestId).to.be.a('number');
        }
        
        expect(groupStock.body.errors).to.be.an('array').that.eql([]);
    
        const deleteStock1 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock1.body.data.id,
            quantity: stock1.body.data.quantity,
            location_id: stock1.body.data.location_id,
            product_id: stock1.body.data.product_id,
            unit_id: stock1.body.data.unit_id,
            version: stock1.body.data.version
        });
        expect(deleteStock1.statusCode).to.equal(200);
        expect(deleteStock1.body.data).to.be.an('object');
        
        if (deleteStock1.body.requestId) {
            expect(deleteStock1.body.requestId).to.be.a('number');
        }
        
        expect(deleteStock1.body.errors).to.be.an('array').that.eql([]);
    
        const deleteStock2 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock2.body.data.id,
            quantity: stock2.body.data.quantity,
            location_id: stock2.body.data.location_id,
            product_id: stock2.body.data.product_id,
            unit_id: stock2.body.data.unit_id,
            version: stock2.body.data.version
        });
        expect(deleteStock2.statusCode).to.equal(200);
        expect(deleteStock2.body.data).to.be.an('object');
        
        if (deleteStock2.body.requestId) {
            expect(deleteStock2.body.requestId).to.be.a('number');
        }
        
        expect(deleteStock2.body.errors).to.be.an('array').that.eql([]);
    });


    // ----------POST UNGROUP -----------
 it('should ungroup one stock', async () => {
    const stock1 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
    expect(stock1.statusCode).to.equal(201);
    expect(stock1.body.data).to.be.an('object');
    
    if (stock1.body.requestId) {
        expect(stock1.body.requestId).to.be.a('number');
    }
    
    expect(stock1.body.errors).to.be.an('array').that.eql([]);

    const stock2 = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW2);
    expect(stock2.statusCode).to.equal(201);
    expect(stock2.body.data).to.be.an('object');
    
    if (stock2.body.requestId) {
        expect(stock2.body.requestId).to.be.a('number');
    }
    
    expect(stock2.body.errors).to.be.an('array').that.eql([]);

    const ungroupStock = await chai.request(URL).post(`/stock/ungroup?id=${TENANT_ID_TEST}`).send([
        {
            id: stock2.body.data.id,
            quantity: stock2.body.data.quantity,
            location_id: stock2.body.data.location_id,
            product_id: stock2.body.data.product_id,
            unit_id: stock2.body.data.unit_id,
            version: stock2.body.data.version
        },
        UNIT1
    ]);
    expect(ungroupStock.statusCode).to.equal(200);
    expect(ungroupStock.body.data).to.be.an('array');
    
    if (ungroupStock.body.requestId) {
        expect(ungroupStock.body.requestId).to.be.a('number');
    }
    
    expect(ungroupStock.body.errors).to.be.an('array').that.eql([]);

    const deleteStock1 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
        id: stock1.body.data.id,
        quantity: stock1.body.data.quantity,
        location_id: stock1.body.data.location_id,
        product_id: stock1.body.data.product_id,
        unit_id: stock1.body.data.unit_id,
        version: stock1.body.data.version
    });
    expect(deleteStock1.statusCode).to.equal(200);
    expect(deleteStock1.body.data).to.be.an('object');
    
    if (deleteStock1.body.requestId) {
        expect(deleteStock1.body.requestId).to.be.a('number');
    }
    
    expect(deleteStock1.body.errors).to.be.an('array').that.eql([]);

    const deleteStock2 = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
        id: stock2.body.data.id,
        quantity: stock2.body.data.quantity,
        location_id: stock2.body.data.location_id,
        product_id: stock2.body.data.product_id,
        unit_id: stock2.body.data.unit_id,
        version: stock2.body.data.version
    });
    expect(deleteStock2.statusCode).to.equal(200);
    expect(deleteStock2.body.data).to.be.an('object');
    
    if (deleteStock2.body.requestId) {
        expect(deleteStock2.body.requestId).to.be.a('number');
    }
    
    expect(deleteStock2.body.errors).to.be.an('array').that.eql([]);
});







    // ---------- POST CHANGE-LOCATION -----------
    it('should change the location of a stock', async () => {
        const location = await chai.request(URL).post(`/location?id=${TENANT_ID_TEST}`).send(LOCATION_NEW);
        expect(location.statusCode).to.equal(201);
        expect(location.body.data).to.be.an('object');
    
        if (location.body.requestId) {
            expect(location.body.requestId).to.be.a('number');
        }
    
        expect(location.body.errors).to.be.an('array').that.eql([]);
    
        const stock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(stock.statusCode).to.equal(201);
        expect(stock.body.data).to.be.an('object');
    
        if (stock.body.requestId) {
            expect(stock.body.requestId).to.be.a('number');
        }
    
        expect(stock.body.errors).to.be.an('array').that.eql([]);
    
        const changeLocation = await chai.request(URL).post(`/stock/change-location?id=${TENANT_ID_TEST}`).send([
            {
                id: stock.body.data.id,
                quantity: stock.body.data.quantity,
                location_id: stock.body.data.location_id,
                product_id: stock.body.data.product_id,
                unit_id: stock.body.data.unit_id,
                version: stock.body.data.version
            },
            {
                id: location.body.data.id,
                code: location.body.data.code,
                description: location.body.data.description,
                version: location.body.data.version
            }
        ]);
        expect(changeLocation.statusCode).to.equal(200);
        expect(changeLocation.body.data).to.be.an('object');
    
        if (changeLocation.body.requestId) {
            expect(changeLocation.body.requestId).to.be.a('number');
        }
    
        expect(changeLocation.body.errors).to.be.an('array').that.eql([]);
    
        const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: stock.body.data.id,
            quantity: stock.body.data.quantity,
            location_id: stock.body.data.location_id,
            product_id: stock.body.data.product_id,
            unit_id: stock.body.data.unit_id,
            version: stock.body.data.version
        });
        expect(deleteStock.statusCode).to.equal(200);
    
        if (deleteStock.body.requestId) {
            expect(deleteStock.body.requestId).to.be.a('number');
        }
    
        expect(deleteStock.body.errors).to.be.an('array').that.eql([]);
    
        const deleteLocation = await chai.request(URL).delete(`/location/${location.body.data.id}?id=${TENANT_ID_TEST}`);
        expect(deleteLocation.statusCode).to.equal(200);
        expect(deleteLocation.body.data).to.be.an('object');
    
        if (deleteLocation.body.requestId) {
            expect(deleteLocation.body.requestId).to.be.a('number');
        }
    
        expect(deleteLocation.body.errors).to.be.an('array').that.eql([]);
    });

    // ---------- GET LOCATION STOCK -----------
    it('should count the location stock', async () => {
        const createStock = await chai.request(URL).post(`/stock?id=${TENANT_ID_TEST}`).send(STOCK_NEW);
        expect(createStock.statusCode).to.equal(201);
        expect(createStock.body.data).to.be.an('object');
    
        if (createStock.body.requestId) {
            expect(createStock.body.requestId).to.be.a('number');
        }
    
        expect(createStock.body.errors).to.be.an('array').that.eql([]);
    
        const locationStock = await chai.request(URL).get(`/stock/count-location/1?id=${TENANT_ID_TEST}`);
        expect(locationStock.statusCode).to.equal(200);
        expect(locationStock.body.data).to.be.an('object');
    
        if (locationStock.body.requestId) {
            expect(locationStock.body.requestId).to.be.a('number');
        }
    
        expect(locationStock.body.errors).to.be.an('array').that.eql([]);
    
        const deleteStock = await chai.request(URL).delete(`/stock?id=${TENANT_ID_TEST}`).send({
            id: createStock.body.data.id,
            quantity: STOCK_NEW.quantity,
            location_id: STOCK_NEW.location_id,
            product_id: STOCK_NEW.product_id,
            unit_id: STOCK_NEW.unit_id,
            version: createStock.body.data.version
        });
        expect(deleteStock.statusCode).to.equal(200);
        expect(deleteStock.body.data).to.be.an('object');
    
        if (deleteStock.body.requestId) {
            expect(deleteStock.body.requestId).to.be.a('number');
        }
    
        expect(deleteStock.body.errors).to.be.an('array').that.eql([]);
    });

    // ---------- GET LOCATION STOCK ERROR -----------
    it('should return 500 if the location does not exist', async () => {
        const locationStock = await chai.request(URL).get(`/stock/count-location/9999?id=${TENANT_ID_TEST}`);
        expect(locationStock.statusCode).to.equal(500);
    
        if (locationStock.body.requestId) {
            expect(locationStock.body.requestId).to.be.a('number');
        }
    
        expect(locationStock.body.errors).to.be.an('array').that.eql([{
            code: 'REG01',
            message: 'The location does not exist.',
            detail: '',
            help: ''
        }]);
    });
});
