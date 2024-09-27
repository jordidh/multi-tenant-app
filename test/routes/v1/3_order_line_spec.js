const chai = require('chai'); // Import Chai for assertions
const dirtyChai = require('dirty-chai'); // Import dirtyChai to avoid using `expect(...).to.be.ok` syntax
const chaiHttp = require('chai-http'); // Import chai-http to make HTTP requests
const expect = require('chai').expect; // Destructure expect from Chai for assertions
const { describe, it, before, after } = require('mocha'); // Import Mocha functions for defining tests

// Set up Chai to use HTTP requests and additional assertions
chai.use(dirtyChai); // Apply dirtyChai plugin to Chai
chai.use(chaiHttp);  // Apply chai-http plugin to Chai

// Define base URLs and other constants for API testing
const BASE_URL = 'http://localhost:3000/v1';
const URL = `${BASE_URL}/order_line`; // Base URL for order line routes
const dbSetupURL = `${BASE_URL}/db-test`; // Base URL for setting up and tearing down test database
const TENANT_ID = 999;  // Hardcoded tenant ID for testing purposes
const idTenantProva = `?id=${TENANT_ID}`; // Query string to use in API calls with tenant ID

// Define sample data for creating a new order line
const ORDER_LINE_NEW = {
    order_id: 1,         // ID of the order
    product_id: 123,     // ID of the product being ordered
    quantity: 10,        // Quantity of the product in the order
    unit_id: 1,          // ID of the unit of measurement
    price: 99.99         // Price of the product
};

let createdOrderLineId; // Variable to store the ID of the created order line

describe('API OrderLines', function () {
    this.timeout(10000);  // Set a higher timeout for async operations, such as database interactions

    // Before running tests, create the test database using the API
    before(async () => {
        const res = await chai.request(dbSetupURL).post('/'); // Send POST request to create the test DB
        expect(res.statusCode).to.equal(201); // Ensure that the database was successfully created
    });

    // After all tests are completed, drop the test database using the API
    after(async () => {
        const res = await chai.request(dbSetupURL).delete('/'); // Send DELETE request to drop the test DB
        expect(res.statusCode).to.equal(200); // Ensure that the database was successfully deleted
    });

    // Test case: Create a new order line
    it('should create a new order line', async () => {
        const res = await chai.request(URL).post('/' + idTenantProva).send(ORDER_LINE_NEW); // Send POST request to create an order line
        expect(res.statusCode).to.equal(201); // Expect a successful creation status
        createdOrderLineId = res.body.data.id; // Store the ID of the created order line for later use
    });

    // Test case: Get details of an existing order line
    it('should return order line details', async () => {
        const res = await chai.request(URL).get('/' + createdOrderLineId + idTenantProva); // Send GET request to retrieve the created order line
        expect(res.statusCode).to.equal(200); // Expect a successful retrieval status
    });

    // Test case: Update an existing order line
    it('should update an existing order line', async () => {
        // Define new values for updating the order line
        const updatedOrderLine = {
            ...ORDER_LINE_NEW,
            quantity: 20,  // Update the quantity to 20
            price: 199.99  // Update the price to 199.99
        };
        const res = await chai.request(URL).put('/' + createdOrderLineId + idTenantProva).send(updatedOrderLine); // Send PUT request to update the order line
        expect(res.statusCode).to.equal(200); // Expect a successful update status
    });

    // Test case: Delete an order line
    it('should delete an order line', async () => {
        const res = await chai.request(URL).delete('/' + createdOrderLineId + idTenantProva); // Send DELETE request to remove the order line
        expect(res.statusCode).to.equal(200); // Expect a successful deletion status
    });

    // Test case: List all order lines
    it('should list all order lines', async () => {
        const res = await chai.request(URL).get('/' + idTenantProva); // Send GET request to list all order lines
        expect(res.statusCode).to.equal(200); // Expect a successful listing status
    });
});