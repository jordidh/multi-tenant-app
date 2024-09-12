const chai = require('chai');
const dirtyChai = require('dirty-chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const { describe, it, before, after } = require('mocha');

chai.use(dirtyChai);
chai.use(chaiHttp);

const URL = 'http://localhost:3000/v1/order';
const DB_SETUP_URL = 'http://localhost:3000/v1/db-test';  // Nueva API para la base de datos

const ORDER_NEW = {
    orderType: 'Customer',
    customer_id: 1,
    provider_id: 2,
    order_date: '2024-06-17',
    due_date: '2024-06-24',
    status: 'Pending',
    warehouse_id_source: 1,
    warehouse_id_destination: 2,
    notes: 'Entrega urgent',
    comments: 'Comentaris',
    version: 0
};

const TENANT_ID_TEST = 999;

describe('API Order', function () {
    this.timeout(10000); // Aumentamos el timeout para operaciones de base de datos

    let createdOrderId; // Guardamos el ID del pedido creado

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

    it('should list all orders', async () => {
        const orders = await chai.request(URL).get(`?id=${TENANT_ID_TEST}`);
        expect(orders.statusCode).to.equal(200);
        expect(orders.body.data).to.be.an('array');
        
        // Verifica si 'requestId' está presente antes de hacer la comparación
        if (orders.body.requestId) {
            expect(orders.body.requestId).to.be.a('string');
        }
    
        expect(orders.body.errors).to.be.an('array').that.eql([]);
    });

    it('should create a new order', async () => {
        const order = await chai.request(URL).post(`?id=${TENANT_ID_TEST}`).send(ORDER_NEW);
        expect(order.statusCode).to.equal(201);
        expect(order.body.data).to.be.an('object');
        expect(order.body.requestId).to.be.a('string');
        expect(order.body.errors).to.be.an('array').that.eql([]);
        createdOrderId = order.body.data.id;
        delete order.body.data.id; // Eliminar el ID para la comparación
        expect(order.body.data).to.deep.equal(ORDER_NEW);
    });

    it('should return order details', async () => {
        const createOrder = await chai.request(URL).post(`?id=${TENANT_ID_TEST}`).send(ORDER_NEW);
        expect(createOrder.statusCode).to.equal(201);
        const order = await chai.request(URL).get('/' + createOrder.body.data.id + `?id=${TENANT_ID_TEST}`);
        expect(order.statusCode).to.equal(200);
        expect(order.body.data).to.be.an('object');
        expect(order.body.requestId).to.be.a('string');
        expect(order.body.errors).to.be.an('array').that.eql([]);
    });

    it('should update an existing order', async () => {
        const createOrder = await chai.request(URL).post(`?id=${TENANT_ID_TEST}`).send(ORDER_NEW);
        expect(createOrder.statusCode).to.equal(201);

        const updateOrder = await chai.request(URL).put(`/${createOrder.body.data.id}?id=${TENANT_ID_TEST}`).send({
            ...ORDER_NEW,
            customer_id: 1,
            provider_id: 2,
            order_date: '2024-06-17',
            due_date: '2024-06-24',
            status: 'Pending',
            warehouse_id_source: 1,
            warehouse_id_destination: 2,
            notes: 'Actualitzant',
            comments: 'Comentaris actualitzats',
            version: 1
        });
        expect(updateOrder.statusCode).to.equal(200);
        expect(updateOrder.body.data).to.be.an('object');
        expect(updateOrder.body.requestId).to.be.a('string');
        expect(updateOrder.body.errors).to.be.an('array').that.eql([]);
    });

    it('should delete an order', async () => {
        const createOrder = await chai.request(URL).post(`?id=${TENANT_ID_TEST}`).send(ORDER_NEW);
        expect(createOrder.statusCode).to.equal(201);
        const deleteOrder = await chai.request(URL).delete(`/${createOrder.body.data.id}?id=${TENANT_ID_TEST}`);
        expect(deleteOrder.statusCode).to.equal(200);
        expect(deleteOrder.body.data).to.be.an('object');
        expect(deleteOrder.body.requestId).to.be.a('string');
        expect(deleteOrder.body.errors).to.be.an('array').that.eql([]);
    });
});