const chai = require('chai'); // Import Chai for assertions
const dirtyChai = require('dirty-chai'); // Import dirtyChai to avoid using `expect(...).to.be.ok` syntax
const chaiHttp = require('chai-http'); // Import chai-http to make HTTP requests
const expect = require('chai').expect; // Destructure expect from Chai for assertions
const { after, before, describe, it } = require('mocha'); // Import Mocha functions

chai.use(dirtyChai); // Apply dirtyChai plugin to Chai
chai.use(chaiHttp); // Apply chai-http plugin to Chai

// Define base URLs for API
const BASE_URL = 'http://localhost:3000/v1';
const URL = `${BASE_URL}/customer`; // Base URL for customer routes
const dbSetupURL = `${BASE_URL}/db-test`; // Base URL for test DB setup

// Define data for creating and updating customers
const CUSTOMER_NEW = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123456789',
    address_id: 1,
    version: 0
};

const CUSTOMER_UPDATE = {
    name: 'John Smith',
    email: 'johnsmith@example.com',
    phone: '987654321',
    address_id: 2,
    version: 1
};

const idTenantProva = "?id=999"; // Example tenant ID for testing

describe('API Customers', function () {
    this.timeout(10000); // Set test timeout to 10 seconds for async operations
    let createdCustomerId; // Variable to store the created customer ID

    // Before running tests, create the test database
    before(async () => {
        const res = await chai.request(dbSetupURL).post('/');
        expect(res.statusCode).to.equal(201); // Check that DB setup was successful
    });

    // After all tests, drop the test database
    after(async () => {
        const res = await chai.request(dbSetupURL).delete('/');
        expect(res.statusCode).to.equal(200); // Check that DB teardown was successful
    });

    it('should create a new customer', async () => {
        try {
            console.log('Creating a new customer...');
            const res = await chai.request(URL).post('/' + idTenantProva).send(CUSTOMER_NEW); // Send POST request to create customer
            console.log('Create customer response:', res.body);
            expect(res.statusCode).to.equal(201); // Expect successful creation status
            expect(res.body.data).to.be.an('object'); // Response should contain a customer object
            expect(res.body.data.id).to.exist; // Customer ID should be present
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string'); // Check if requestId is a string
            }
            expect(res.body.errors).to.be.an('array').that.eql([]); // No errors expected
            createdCustomerId = res.body.data.id; // Store created customer ID
        } catch (error) {
            console.log('Error in creating customer:', error);
            throw error;
        }
    });

    it('should return customer details', async () => {
        try {
            console.log('Retrieving customer details for ID:', createdCustomerId);
            const res = await chai.request(URL).get('/' + createdCustomerId + idTenantProva); // Send GET request to retrieve customer details
            console.log('Get customer details response:', res.body);
            expect(res.statusCode).to.equal(200); // Expect successful retrieval status
            expect(res.body.data).to.be.an('object'); // Response should contain a customer object
            expect(res.body.data.id).to.equal(createdCustomerId); // Ensure correct customer ID is returned
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string'); // Check if requestId is a string
            }
            expect(res.body.errors).to.be.an('array').that.eql([]); // No errors expected
        } catch (error) {
            console.log('Error in retrieving customer details:', error);
            throw error;
        }
    });

    it('should update an existing customer', async () => {
        console.log(`Updating customer with ID: ${createdCustomerId}`);
        const getRes = await chai.request(URL).get('/' + createdCustomerId + idTenantProva); // Get current customer data
        const currentVersion = getRes.body.data.version; // Get the current version of the customer

        // Prepare the updated customer data, including the correct version
        const customerUpdateWithCorrectVersion = {
            ...CUSTOMER_UPDATE,
            version: currentVersion
        };

        // Send PUT request to update the customer
        const res = await chai.request(URL).put('/' + createdCustomerId + idTenantProva).send(customerUpdateWithCorrectVersion);
        console.log('Update customer response:', res.body);
        expect(res.statusCode).to.equal(200); // Expect successful update status
        expect(res.body.data).to.be.an('object'); // Response should contain an updated customer object
        expect(res.body.data.name).to.equal(CUSTOMER_UPDATE.name); // Ensure the name was updated
        expect(res.body.data.email).to.equal(CUSTOMER_UPDATE.email); // Ensure the email was updated
        expect(res.body.data.phone).to.equal(CUSTOMER_UPDATE.phone); // Ensure the phone was updated
        if (res.body.requestId) {
            expect(res.body.requestId).to.be.a('string'); // Check if requestId is a string
        }
        expect(res.body.errors).to.be.an('array').that.eql([]); // No errors expected
    });

    it('should delete a customer', async () => {
        try {
            console.log('Deleting customer with ID:', createdCustomerId);
            const res = await chai.request(URL).delete('/' + createdCustomerId + idTenantProva); // Send DELETE request to remove the customer
            console.log('Delete customer response:', res.body);
            expect(res.statusCode).to.equal(200); // Expect successful deletion status
            expect(Number(res.body.data.id)).to.equal(createdCustomerId); // Ensure the correct customer was deleted
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string'); // Check if requestId is a string
            }
            expect(res.body.errors).to.be.an('array').that.eql([]); // No errors expected
            createdCustomerId = null;  // Reset the customer ID after deletion
        } catch (error) {
            console.log('Error in deleting customer:', error);
            throw error;
        }
    });

    it('should list all customers', async () => {
        try {
            console.log('Listing all customers...');
            const res = await chai.request(URL).get('/' + idTenantProva); // Send GET request to list all customers
            console.log('List all customers response:', res.body);
            expect(res.statusCode).to.equal(200); // Expect successful listing status
            expect(res.body.data).to.be.an('array'); // Response should be an array of customers
            expect(res.body.data).to.have.length.greaterThan(0); // Ensure there are customers in the list
            expect(res.body.data[0]).to.have.property('id'); // Ensure each customer has an ID
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string');  // Ensure requestId is a string
            }
            expect(res.body.errors).to.be.an('array').that.eql([]); // No errors expected
        } catch (error) {
            console.log('Error in listing customers:', error);
            throw error;
        }
    });

    it('should return 500 if the customer requested does not exist', async () => {
        console.log('Requesting non-existent customer...');
        try {
            const res = await chai.request(URL).get('/999' + idTenantProva); // Try to retrieve a non-existent customer
            console.log('Get non-existent customer response:', res.body);
            expect(res.statusCode).to.equal(500); // Expect failure status code
            expect(res.body.errors).to.be.an('array').that.eql(['Customer not found']); // Expect 'Customer not found' error
        } catch (error) {
            console.error('Error in requesting non-existent customer:', error);
            throw error;
        }
    });
});