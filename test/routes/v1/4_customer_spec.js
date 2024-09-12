const chai = require('chai');
const dirtyChai = require('dirty-chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const { after, before, describe, it } = require('mocha');

chai.use(dirtyChai);
chai.use(chaiHttp);

// URLs
const BASE_URL = 'http://localhost:3000/v1';
const URL = `${BASE_URL}/customer`;
const dbSetupURL = `${BASE_URL}/db-test`;  // URL for the DB setup API

// Test Data
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

const idTenantProva = "?id=999";

describe('API Customers', function () {
    this.timeout(10000); 
    let createdCustomerId;

    // Create the test database before running the tests
    before(async () => {
        const res = await chai.request(dbSetupURL).post('/');
        expect(res.statusCode).to.equal(201);  // Ensure DB creation was successful
    });

    // Drop the test database after running the tests
    after(async () => {
        const res = await chai.request(dbSetupURL).delete('/');
        expect(res.statusCode).to.equal(200);  // Ensure DB drop was successful
    });

    it('should create a new customer', async () => {
        try {
            console.log('Creating a new customer...');
            const res = await chai.request(URL).post('/' + idTenantProva).send(CUSTOMER_NEW);
            console.log('Create customer response:', res.body);
            expect(res.statusCode).to.equal(201);
            expect(res.body.data).to.be.an('object');
            expect(res.body.data.id).to.exist;
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string');
            }
            expect(res.body.errors).to.be.an('array').that.eql([]);
            createdCustomerId = res.body.data.id;
        } catch (error) {
            console.log('Error in creating customer:', error);
            throw error;
        }
    });

    it('should return customer details', async () => {
        try {
            console.log('Retrieving customer details for ID:', createdCustomerId);
            const res = await chai.request(URL).get('/' + createdCustomerId + idTenantProva);
            console.log('Get customer details response:', res.body);
            expect(res.statusCode).to.equal(200);
            expect(res.body.data).to.be.an('object');
            expect(res.body.data.id).to.equal(createdCustomerId);
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string');
            }
            expect(res.body.errors).to.be.an('array').that.eql([]);
        } catch (error) {
            console.log('Error in retrieving customer details:', error);
            throw error;
        }
    });

    it('should update an existing customer', async () => {
        console.log(`Updating customer with ID: ${createdCustomerId}`);
        const getRes = await chai.request(URL).get('/' + createdCustomerId + idTenantProva);
        const currentVersion = getRes.body.data.version;

        const customerUpdateWithCorrectVersion = {
            ...CUSTOMER_UPDATE,
            version: currentVersion
        };

        const res = await chai.request(URL).put('/' + createdCustomerId + idTenantProva).send(customerUpdateWithCorrectVersion);
        console.log('Update customer response:', res.body);
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.name).to.equal(CUSTOMER_UPDATE.name);
        expect(res.body.data.email).to.equal(CUSTOMER_UPDATE.email);
        expect(res.body.data.phone).to.equal(CUSTOMER_UPDATE.phone);
        if (res.body.requestId) {
            expect(res.body.requestId).to.be.a('string');
        }
        expect(res.body.errors).to.be.an('array').that.eql([]);
    });

    it('should delete a customer', async () => {
        try {
            console.log('Deleting customer with ID:', createdCustomerId);
            const res = await chai.request(URL).delete('/' + createdCustomerId + idTenantProva);
            console.log('Delete customer response:', res.body);
            expect(res.statusCode).to.equal(200);
            expect(Number(res.body.data.id)).to.equal(createdCustomerId);
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string');
            }
            expect(res.body.errors).to.be.an('array').that.eql([]);
            createdCustomerId = null;  // Customer is deleted, reset ID
        } catch (error) {
            console.log('Error in deleting customer:', error);
            throw error;
        }
    });

    it('should list all customers', async () => {
        try {
            console.log('Listing all customers...');
            const res = await chai.request(URL).get('/' + idTenantProva);
            console.log('List all customers response:', res.body);
            expect(res.statusCode).to.equal(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.length.greaterThan(0); // Check there are customers
            expect(res.body.data[0]).to.have.property('id'); // Check each customer has an ID
            if (res.body.requestId) {
                expect(res.body.requestId).to.be.a('string');  // Fix: Check if requestId is present and a string
            }
            expect(res.body.errors).to.be.an('array').that.eql([]);
        } catch (error) {
            console.log('Error in listing customers:', error);
            throw error;
        }
    });

    it('should return 500 if the customer requested does not exist', async () => {
        console.log('Requesting non-existent customer...');
        try {
            const res = await chai.request(URL).get('/999' + idTenantProva);
            console.log('Get non-existent customer response:', res.body);
            expect(res.statusCode).to.equal(500);
            expect(res.body.errors).to.be.an('array').that.eql(['Customer not found']);
        } catch (error) {
            console.error('Error in requesting non-existent customer:', error);
            throw error;
        }
    });
});