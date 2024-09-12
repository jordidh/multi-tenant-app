const chai = require('chai');
const dirtyChai = require('dirty-chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const { describe, it, before, after } = require('mocha');

// Set up Chai to use HTTP requests and additional assertions
chai.use(dirtyChai);
chai.use(chaiHttp);

// Set the base URL and other constants directly (no environment variables)
const BASE_URL = 'http://localhost:3000/v1';
const URL = `${BASE_URL}/order_line`;
const dbSetupURL = `${BASE_URL}/db-test`;  // URL for the new API
const TENANT_ID = 999;  // Hardcoded tenant ID for testing
const idTenantProva = `?id=${TENANT_ID}`;

// Sample data for creating a new order line (hardcoded values)
const ORDER_LINE_NEW = {
    order_id: 1,
    product_id: 123,
    quantity: 10,
    unit_id: 1,
    price: 99.99
};

let createdOrderLineId;

describe('API OrderLines', function () {
    this.timeout(10000);  // Set a higher timeout for database operations

    // Call the API to create the test database before the tests
    before(async () => {
        const res = await chai.request(dbSetupURL).post('/');
        expect(res.statusCode).to.equal(201);
    });

    // Call the API to drop the test database after the tests
    after(async () => {
        const res = await chai.request(dbSetupURL).delete('/');
        expect(res.statusCode).to.equal(200);
    });

    // Test case: Create a new order line
    it('should create a new order line', async () => {
        const res = await chai.request(URL).post('/' + idTenantProva).send(ORDER_LINE_NEW);
        expect(res.statusCode).to.equal(201);
        createdOrderLineId = res.body.data.id;
    });

    // Test case: Get details of an existing order line
    it('should return order line details', async () => {
        const res = await chai.request(URL).get('/' + createdOrderLineId + idTenantProva);
        expect(res.statusCode).to.equal(200);
    });

    // Test case: Update an existing order line
    it('should update an existing order line', async () => {
        const updatedOrderLine = {
            ...ORDER_LINE_NEW,
            quantity: 20,  // Hardcoded updated values
            price: 199.99
        };
        const res = await chai.request(URL).put('/' + createdOrderLineId + idTenantProva).send(updatedOrderLine);
        expect(res.statusCode).to.equal(200);
    });

    // Test case: Delete an order line
    it('should delete an order line', async () => {
        const res = await chai.request(URL).delete('/' + createdOrderLineId + idTenantProva);
        expect(res.statusCode).to.equal(200);
    });

    // Test case: List all order lines
    it('should list all order lines', async () => {
        const res = await chai.request(URL).get('/' + idTenantProva);
        expect(res.statusCode).to.equal(200);
    });
});