/*const chai = require('chai');
const dirtyChai = require('dirty-chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const { after, describe, it } = require('mocha');

chai.use(dirtyChai);
chai.use(chaiHttp);

const URL = 'http://localhost:3000/order_line';
const idTenantProva = "?id=999";

// Exemple d'una nova order line
const ORDER_LINE_NEW = {
    order_id: 1,
    product_id: 123,
    quantity: 10,
    unit_id: 1,
    price: 99.99
};

describe('API OrderLines', () => {
    let createdOrderLineId;

    // ----------POST ORDER LINE-----------
    it('should create a new order line', async () => {
        const res = await chai.request(URL).post('/' + idTenantProva).send(ORDER_LINE_NEW);
        expect(res.statusCode).to.equal(201);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.id).to.exist;
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
        createdOrderLineId = res.body.data.id;
    });

    // ----------GET ORDER LINE DETAILS-----------
    it('should return order line details', async () => {
        const res = await chai.request(URL).get('/' + createdOrderLineId + idTenantProva);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.id).to.equal(createdOrderLineId);
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    // ----------UPDATE ORDER LINE-----------
    it('should update an existing order line', async () => {
        const updatedOrderLine = {
            ...ORDER_LINE_NEW,
            product_id: 124,
            quantity: 20,
            price: 199.99
        };
        const res = await chai.request(URL).put('/' + createdOrderLineId + idTenantProva).send(updatedOrderLine);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.product_id).to.equal(124);
        expect(res.body.data.quantity).to.equal(20);
        expect(res.body.data.price).to.equal(199.99);
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    // ----------DELETE ORDER LINE-----------
    it('should delete an order line', async () => {
        const res = await chai.request(URL).delete('/' + createdOrderLineId + idTenantProva);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.id).to.equal(createdOrderLineId);
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    // ----------GET ALL ORDER LINES-----------
    it('should list all order lines', async () => {
        const res = await chai.request(URL).get('/' + idTenantProva);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });
});*/

const chai = require('chai');
const dirtyChai = require('dirty-chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const { after, describe, it, before } = require('mocha');

chai.use(dirtyChai);
chai.use(chaiHttp);

const URL = 'http://localhost:3000/order_line';
const idTenantProva = "?id=999";

const ORDER_LINE_NEW = {
    order_id: 1,
    product_id: 123,
    quantity: 10,
    unit_id: 1,
    price: 99.99
};

describe('API OrderLines', function() {
    this.timeout(5000);

    let createdOrderLineId;

    it('should create a new order line', async () => {
        const res = await chai.request(URL).post('/' + idTenantProva).send(ORDER_LINE_NEW);
        expect(res.statusCode).to.equal(201);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.id).to.exist;
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
        createdOrderLineId = res.body.data.id;
    });

    it('should return order line details', async () => {
        const res = await chai.request(URL).get('/' + createdOrderLineId + idTenantProva);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.id).to.equal(createdOrderLineId);
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    it('should update an existing order line', async () => {
        const updatedOrderLine = {
            order_id: 1,
            product_id: 123, // ID del producte existent
            quantity: 20,
            unit_id: 1,
            price: 199.99
        };
        const res = await chai.request(URL).put('/' + createdOrderLineId + idTenantProva).send(updatedOrderLine);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.product_id).to.equal(updatedOrderLine.product_id);
        expect(res.body.data.quantity).to.equal(20);
        expect(res.body.data.price).to.equal(199.99);
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    it('should delete an order line', async () => {
        const res = await chai.request(URL).delete('/' + createdOrderLineId + idTenantProva);
        expect(res.statusCode).to.equal(200);
        expect(Number(res.body.data.id)).to.equal(createdOrderLineId);
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    it('should list all order lines', async () => {
        const res = await chai.request(URL).get('/' + idTenantProva);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.requestId).to.be.a('string');
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });
});